/**
 * One-shot Chromium Tab baseline: open about:blank, sample workingSetSize, close.
 * Opt-in: FS_ELECTRON_MEM_BLANK_PROBE=1 (with or without FS_ELECTRON_MEM).
 */
import { app, BrowserWindow } from 'electron';

export const runBlankWindowMemoryProbe = async (): Promise<void> => {
	if (process.env.FS_ELECTRON_MEM_BLANK_PROBE !== '1') {
		return;
	}

	await app.whenReady();
	const win = new BrowserWindow({
		show: false,
		width: 800,
		height: 600,
		webPreferences: { backgroundThrottling: false },
	});
	await win.loadURL('about:blank');
	// Let the renderer settle
	await new Promise((r) => setTimeout(r, 3000));
	const pid = win.webContents.getOSProcessId();
	const metric = app.getAppMetrics().find((m) => m.pid === pid);
	const rssMB = metric ? Math.round((metric.memory?.workingSetSize ?? 0) / 1024) : null;
	console.log(
		'[fs-mem] blank-window probe',
		JSON.stringify({ pid, rssMB, type: metric?.type, url: win.webContents.getURL() }),
	);
	win.destroy();
};
