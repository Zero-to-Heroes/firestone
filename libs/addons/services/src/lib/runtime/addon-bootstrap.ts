/**
 * Bootstrap injected into each sandboxed add-on iframe.
 * Exposes firestone.defineAddon(factory) and a capability-gated RPC client.
 */
export const buildAddonBootstrapSource = (addonId: string): string => `
(function () {
  var ADDON_ID = ${JSON.stringify(addonId)};
  var pending = Object.create(null);
  var nextId = 1;
  var eventHandlers = Object.create(null);

  function rpc(method, args) {
    return new Promise(function (resolve, reject) {
      var id = String(nextId++);
      pending[id] = { resolve: resolve, reject: reject };
      parent.postMessage({
        channel: 'firestone-addon',
        type: 'rpc',
        addonId: ADDON_ID,
        id: id,
        method: method,
        args: args || []
      }, '*');
    });
  }

  window.addEventListener('message', function (event) {
    var data = event && event.data;
    if (!data || data.channel !== 'firestone-addon' || data.addonId !== ADDON_ID) {
      return;
    }
    if (data.type === 'rpc-result') {
      var waiter = pending[data.id];
      if (!waiter) {
        return;
      }
      delete pending[data.id];
      if (data.error) {
        waiter.reject(new Error(data.error));
      } else {
        waiter.resolve(data.result);
      }
      return;
    }
    if (data.type === 'event') {
      var list = eventHandlers[data.eventName] || [];
      for (var i = 0; i < list.length; i++) {
        try {
          list[i](data.payload);
        } catch (e) {
          console.error('[addon:' + ADDON_ID + '] event handler error', e);
        }
      }
    }
  });

  function onEvent(eventName, handler) {
    if (!eventHandlers[eventName]) {
      eventHandlers[eventName] = [];
    }
    eventHandlers[eventName].push(handler);
    return function unsubscribe() {
      eventHandlers[eventName] = (eventHandlers[eventName] || []).filter(function (h) {
        return h !== handler;
      });
    };
  }

  var api = {
    events: {
      onBattlegroundsGameEnd: function (handler) {
        return onEvent('battlegroundsGameEnd', handler);
      }
    },
    storage: {
      get: function (key) {
        return rpc('storage.get', [key]);
      },
      set: function (key, value) {
        return rpc('storage.set', [key, value]);
      }
    },
    net: {
      fetch: function (url, init) {
        return rpc('net.fetch', [url, init || {}]);
      }
    },
    log: {
      info: function () {
        var args = Array.prototype.slice.call(arguments);
        return rpc('log.info', args);
      },
      warn: function () {
        var args = Array.prototype.slice.call(arguments);
        return rpc('log.warn', args);
      },
      error: function () {
        var args = Array.prototype.slice.call(arguments);
        return rpc('log.error', args);
      }
    },
    getSettings: function () {
      return rpc('getSettings', []);
    }
  };

  window.firestone = {
    defineAddon: function (factory) {
      try {
        var result = factory(api);
        Promise.resolve(result).then(function () {
          parent.postMessage({
            channel: 'firestone-addon',
            type: 'addon-ready',
            addonId: ADDON_ID
          }, '*');
        }).catch(function (err) {
          parent.postMessage({
            channel: 'firestone-addon',
            type: 'addon-error',
            addonId: ADDON_ID,
            error: (err && err.message) ? err.message : String(err)
          }, '*');
        });
      } catch (err) {
        parent.postMessage({
          channel: 'firestone-addon',
          type: 'addon-error',
          addonId: ADDON_ID,
          error: (err && err.message) ? err.message : String(err)
        }, '*');
      }
    }
  };
})();
`;
