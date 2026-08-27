const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('probe', {
	onTarget: (cb) => ipcRenderer.on('target', (_e, payload) => cb(payload)),
	reportClick: () => ipcRenderer.send('probe-click'),
});
