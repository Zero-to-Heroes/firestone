/* eslint-disable @typescript-eslint/no-explicit-any */

// Flashes external OS windows (e.g. the Hearthstone game window) by title, replicating the
// Win32 EnumWindows + FlashWindowEx behaviour of the legacy ow-utils C# plugin (FlashWindow.cs).
// Electron's BrowserWindow.flashFrame() can only target the app's own windows, so we call into
// user32.dll directly to flash the taskbar button of an arbitrary external window.

// FlashWindowEx flags (see winuser.h)
const FLASHW_ALL = 3; // Flash both caption and taskbar button
const FLASHW_TIMERNOFG = 12; // Keep flashing until the window comes to the foreground

interface Win32Bindings {
	koffi: any;
	enumWindowsProto: any;
	EnumWindows: any;
	IsWindowVisible: any;
	GetWindowTextLengthW: any;
	GetWindowTextW: any;
	FlashWindowEx: any;
	flashWinfoSize: number;
}

// undefined = not yet attempted, null = unavailable (non-Windows or load failure)
let bindings: Win32Bindings | null | undefined;

function getBindings(): Win32Bindings | null {
	if (bindings !== undefined) {
		return bindings;
	}
	if (process.platform !== 'win32') {
		bindings = null;
		return bindings;
	}
	try {
		// koffi is declared as an external dependency (apps/electron-app/project.json) and unpacked
		// from the asar archive (electron-builder.yml), so a plain require resolves its prebuilt
		// native binary at runtime.
		const koffi = require('koffi');
		const user32 = koffi.load('user32.dll');

		const enumWindowsProto = koffi.proto('bool __stdcall EnumWindowsProc(void* hwnd, intptr_t lParam)');
		koffi.struct('FLASHWINFO', {
			cbSize: 'uint32',
			hwnd: 'void*',
			dwFlags: 'uint32',
			uCount: 'uint32',
			dwTimeout: 'uint32',
		});

		bindings = {
			koffi,
			enumWindowsProto,
			EnumWindows: user32.func('bool __stdcall EnumWindows(void* lpEnumFunc, intptr_t lParam)'),
			IsWindowVisible: user32.func('bool __stdcall IsWindowVisible(void* hWnd)'),
			GetWindowTextLengthW: user32.func('int __stdcall GetWindowTextLengthW(void* hWnd)'),
			GetWindowTextW: user32.func(
				'int __stdcall GetWindowTextW(void* hWnd, _Out_ uint16_t* lpString, int nMaxCount)',
			),
			FlashWindowEx: user32.func('bool __stdcall FlashWindowEx(FLASHWINFO* pwfi)'),
			flashWinfoSize: koffi.sizeof('FLASHWINFO'),
		};
	} catch (e) {
		console.warn('[win32-window-utils] could not initialize koffi/user32 bindings', e);
		bindings = null;
	}
	return bindings;
}

function getWindowTitle(b: Win32Bindings, hwnd: any): string {
	const len = b.GetWindowTextLengthW(hwnd);
	if (len <= 0) {
		return '';
	}
	// GetWindowTextW writes a null-terminated UTF-16 string, so allocate len + 1 wide chars.
	const buffer = Buffer.alloc((len + 1) * 2);
	b.GetWindowTextW(hwnd, buffer, len + 1);
	return buffer.toString('utf16le', 0, len * 2);
}

function flashHandle(b: Win32Bindings, hwnd: any): void {
	b.FlashWindowEx({
		cbSize: b.flashWinfoSize,
		hwnd: hwnd,
		dwFlags: FLASHW_ALL | FLASHW_TIMERNOFG,
		uCount: 0xffffffff,
		dwTimeout: 0,
	});
}

/**
 * Flash the taskbar button of every visible external window whose title exactly matches
 * `windowName` (matching the legacy C# ow-utils behaviour, which used `title.Equals(windowName)`).
 * Returns true if at least one matching window was flashed.
 */
export function flashExternalWindowByTitle(windowName: string): boolean {
	const b = getBindings();
	if (!b) {
		return false;
	}

	let flashed = false;
	const callback = b.koffi.register((hwnd: any, _lParam: any) => {
		try {
			if (!b.IsWindowVisible(hwnd)) {
				return true;
			}
			const title = getWindowTitle(b, hwnd);
			if (title === windowName) {
				flashHandle(b, hwnd);
				flashed = true;
			}
		} catch (e) {
			console.warn('[win32-window-utils] error while inspecting window', e);
		}
		// Returning true keeps the enumeration going (we may have several matching windows).
		return true;
	}, b.koffi.pointer(b.enumWindowsProto));

	try {
		b.EnumWindows(callback, 0);
	} catch (e) {
		console.warn('[win32-window-utils] EnumWindows failed', e);
	} finally {
		b.koffi.unregister(callback);
	}

	return flashed;
}
