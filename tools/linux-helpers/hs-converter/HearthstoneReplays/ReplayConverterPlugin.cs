using System;
using System.Threading.Tasks;
using HearthstoneReplays.Parser;
using HearthstoneReplays.Events;
using Newtonsoft;
using Newtonsoft.Json;
using System.Collections.Generic;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Xml.Linq;
using HearthstoneReplays.Enums;

namespace HearthstoneReplays
{
    public class ReplayConverterPlugin
    {
        // a global event that triggers with two parameters:
        //
        // plugin.get().onGlobalEvent.addListener(function(first, second) {
        //  ...
        // });
        public event Action<object, object> onGlobalEvent;
        public event Action<string> onGameEvent;

        public void setGameEventCallback(Action<object> callback)
        {
            this.onGameEvent += callback;
        }
        public void setLogger(Action<object, object> callback)
        {
            this.onGlobalEvent += callback;
            Logger.Log = callback;
        }


        // plugin.get().convertLogsToXml(xmlLogs, function(result) {
        //   console.log(result);
        // });
        // 
        // notice how we will always call the callback on a new thread
        public void convertLogsToXml(string logs, Action<object> callback)
        {
            Logger.Log = onGlobalEvent;

            if (callback == null)
            {
                onGlobalEvent("No callback, returning", "");
                return;
            }

            Task.Run(() =>
            {
                try
                {
                    string replayXml = new ReplayConverter().xmlFromLogs(logs);
                    onGlobalEvent("Serialized", replayXml.Length);
                    callback(replayXml);
                }
                catch (Exception e)
                {
                    onGlobalEvent("Exception when parsing game " + e.GetBaseException(), logs);
                    callback(null);
                }
            });
        }

        private ReplayParser parser = new ReplayParser();

        public void initRealtimeLogConversion(Action<object> callback)
        {
            Task.Run(() =>
            {
                try
                {
                    Logger.Log = onGlobalEvent;
                    GameEventHandler.EventProvider = (GameEvent gameEvent) => onGameEvent(JsonConvert.SerializeObject(gameEvent, new JsonSerializerSettings()
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore
                    }));
                    // The goal here is to make sure the order is kept while in Dev mode, where events are very rapidly firing
                    GameEventHandler.EventProviderAll = (IList<GameEvent> gameEvents) => onGameEvent(JsonConvert.SerializeObject(gameEvents, new JsonSerializerSettings()
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore
                    }));
                    parser = new ReplayParser();
                    parser.Init();
                    callback?.Invoke(null);
                }
                catch (Exception e)
                {
                    Logger.Log("Exception in initRealtimeLogConversion " + e?.GetBaseException(), "");
                    callback(null);
                }
            });
        }

        public void realtimeLogProcessing(string[] logLines, Action<object> callback)
        {
            //Logger.Log("[debug] running async task", "");
            Task.Run(() =>
            {
                try
                {
                    // If we have a "create_game" log and no game seed, we defer
                    //Logger.Log("computing game seed", parser.State?.GSState == null);
                    var gameSeed = parser.ExtractGameSeed(logLines);
                    //Logger.Log("realtimeLogProcessing", parser.State?.GSState == null);
                    for (var i = 0; i < logLines.Length; i++)
                    {
                        parser.ReadLine(logLines[i], gameSeed, i);
                    }
                    callback(null);
                }
                catch (Exception e)
                {
                    Logger.Log("Exception when parsing game " + e?.GetBaseException()
                                + " // " + logLines[logLines.Length - 1], "");
                    callback(null);
                }
            });
        }

        public void askForGameStateUpdate()
        {
            Task.Run(() =>
            {
                //Logger.Log("askForGameStateUpdate", "internal");
                parser.AskForGameStateUpdate();
            });
        }

        public void triggerGlobalEvent(string first, string second)
        {
            if (onGlobalEvent == null)
            {
                return;
            }

            Task.Run(() =>
            {
                onGlobalEvent(first, second);
            });
        }
    }

}
