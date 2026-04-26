/* eslint-disable no-async-promise-executor */

import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { IOwUtilsService } from '@firestone/shared/framework/core';
import { BrowserWindow, Notification, clipboard, nativeImage } from 'electron';
import extract from 'extract-zip';

export class LowLevelUtilsElectronService implements IOwUtilsService {
	public async deleteFileOrFolder(targetPath: string): Promise<void> {
		try {
			await fs.promises.rm(targetPath, { recursive: true, force: true });
		} catch (e) {
			if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
				console.warn('[low-level-utils-electron] could not delete file or folder', targetPath, e);
			}
		}
	}

	public async copyFile(sourcePath: string, destinationDirectory: string): Promise<void> {
		const fileName = path.basename(sourcePath);
		const destPath = path.join(destinationDirectory, fileName);
		await fs.promises.mkdir(destinationDirectory, { recursive: true });
		await fs.promises.copyFile(sourcePath, destPath);
	}

	public async renameFile(sourcePath: string, newName: string): Promise<boolean> {
		try {
			const dir = path.dirname(sourcePath);
			const newPath = path.join(dir, newName);
			await fs.promises.rename(sourcePath, newPath);
			return true;
		} catch (e) {
			console.warn('[low-level-utils-electron] could not renameFile', sourcePath, newName, e);
			return false;
		}
	}

	public async copyFiles(sourceDirectory: string, destinationDirectory: string): Promise<void> {
		await fs.promises.mkdir(destinationDirectory, { recursive: true });
		await fs.promises.cp(sourceDirectory, destinationDirectory, { recursive: true });
	}

	public async downloadFileTo(
		fileUrl: string,
		targetPath: string,
		targetFileName: string,
	): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			const destPath = path.join(targetPath, targetFileName);
			fs.promises
				.mkdir(targetPath, { recursive: true })
				.then(() => {
					const protocol = fileUrl.startsWith('https') ? https : http;
					const request = protocol.get(fileUrl, (response) => {
						if (response.statusCode === 301 || response.statusCode === 302) {
							const redirectUrl = response.headers.location;
							if (redirectUrl) {
								this.downloadFileTo(redirectUrl, targetPath, targetFileName).then(resolve);
								return;
							}
						}
						if (response.statusCode !== 200) {
							console.warn('[low-level-utils-electron] downloadFileTo failed', response.statusCode);
							resolve(false);
							return;
						}
						const fileStream = fs.createWriteStream(destPath);
						response.pipe(fileStream);
						fileStream.on('finish', () => {
							fileStream.close();
							resolve(true);
						});
						fileStream.on('error', (e) => {
							console.warn('[low-level-utils-electron] downloadFileTo stream error', e);
							fs.unlink(destPath, () => {});
							resolve(false);
						});
					});
					request.on('error', (e) => {
						console.warn('[low-level-utils-electron] downloadFileTo request error', e);
						resolve(false);
					});
				})
				.catch((e) => {
					console.warn('[low-level-utils-electron] downloadFileTo mkdir error', e);
					resolve(false);
				});
		});
	}

	public async downloadAndUnzipFile(fileUrl: string, targetPath: string): Promise<void> {
		const tempDir = os.tmpdir();
		const tempFileName = `firestone-download-${Date.now()}.zip`;
		const tempFilePath = path.join(tempDir, tempFileName);

		try {
			const success = await this.downloadFileTo(fileUrl, tempDir, tempFileName);
			if (!success) {
				console.warn('[low-level-utils-electron] downloadAndUnzipFile download failed');
				return;
			}

			await fs.promises.mkdir(targetPath, { recursive: true });
			await extract(tempFilePath, { dir: targetPath });
		} catch (e) {
			console.warn('[low-level-utils-electron] could not downloadAndUnzipFile', fileUrl, e);
		} finally {
			try {
				await fs.promises.unlink(tempFilePath);
			} catch {
				// Ignore cleanup errors
			}
		}
	}

	public async flashWindow(windowName = 'Hearthstone'): Promise<void> {
		const win = this.findWindowByTitle(windowName);
		if (win) {
			win.flashFrame(true);
		} else {
			console.warn('[low-level-utils-electron] flashWindow unsupported for non-Electron window', windowName);
		}
	}

	public async showWindowsNotification(title: string, text: string): Promise<void> {
		new Notification({ title, body: text }).show();
	}

	public async captureWindow(
		windowName: string,
		copyToClipboard = false,
	): Promise<[string | null, unknown]> {
		const win = this.findWindowByTitle(windowName);
		if (!win || win.isDestroyed()) {
			console.warn('[low-level-utils-electron] captureWindow unsupported for non-Electron window', windowName);
			return [null, null];
		}

		try {
			const image = await win.webContents.capturePage();
			const dataUrl = image.toDataURL();
			if (copyToClipboard) {
				clipboard.writeImage(image);
			}
			return [dataUrl, image];
		} catch (e) {
			console.warn('[low-level-utils-electron] could not captureWindow', windowName, e);
			return [null, null];
		}
	}

	public async captureActiveWindow(): Promise<[string | null, unknown]> {
		const win = BrowserWindow.getFocusedWindow();
		if (!win || win.isDestroyed()) {
			console.warn('[low-level-utils-electron] captureActiveWindow unsupported outside Electron windows');
			return [null, null];
		}

		try {
			const image = await win.webContents.capturePage();
			const dataUrl = image.toDataURL();
			return [dataUrl, null];
		} catch (e) {
			console.warn('[low-level-utils-electron] could not captureActiveWindow', e);
			return [null, null];
		}
	}

	public async copyImageDataUrlToClipboard(dataUrl: string): Promise<void> {
		const image = nativeImage.createFromDataURL(dataUrl);
		if (!image.isEmpty()) {
			clipboard.writeImage(image);
		}
	}

	public async get(): Promise<unknown> {
		// No-op for Electron: plugin initialization not needed
		return Promise.resolve();
	}

	private findWindowByTitle(windowName: string): BrowserWindow | null {
		const windows = BrowserWindow.getAllWindows();
		return windows.find((w) => !w.isDestroyed() && w.getTitle()?.includes(windowName)) ?? null;
	}
}
