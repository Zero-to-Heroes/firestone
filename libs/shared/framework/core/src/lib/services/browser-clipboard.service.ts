import { Injectable } from '@angular/core';
import { IClipboardService } from './clipboard-service.interface';

/**
 * Browser implementation of clipboard using navigator.clipboard with execCommand fallback.
 * Used when neither Overwolf nor Electron is available (e.g. web/coliseum).
 */
@Injectable()
export class BrowserClipboardService implements IClipboardService {
	async placeOnClipboard(value: string): Promise<void> {
		if (navigator.clipboard?.writeText) {
			try {
				await navigator.clipboard.writeText(value);
				return;
			} catch (err) {
				console.warn('Modern clipboard API failed, falling back to execCommand', err);
			}
		}

		const listener = (e: ClipboardEvent) => {
			if (e.clipboardData) {
				e.clipboardData.setData('text/plain', value);
				e.preventDefault();
			}
		};
		document.addEventListener('copy', listener);
		try {
			document.execCommand('copy');
		} finally {
			document.removeEventListener('copy', listener);
		}
	}

	async getFromClipboard(): Promise<string> {
		if (navigator.clipboard?.readText) {
			try {
				return await navigator.clipboard.readText();
			} catch (err) {
				console.warn('Modern clipboard API failed for read', err);
			}
		}
		return '';
	}
}
