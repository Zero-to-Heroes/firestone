import { Injectable } from '@angular/core';
import { net } from 'electron';
import { IApiRunner } from './electron-api-runner.interface';

type ElectronApiRunnerRequestOptions = {
	readonly method: 'GET' | 'POST';
	readonly headers?: Record<string, string>;
	readonly body?: string;
};

/**
 * Parses a JSON string off the main thread and returns the parsed value.
 * `ok: false` means the offload failed and the caller should parse locally.
 */
export type OffThreadJsonParser = (text: string) => Promise<{ ok: boolean; value: any }>;

/**
 * Payloads smaller than this are parsed inline: JSON.parse of ~256 KB is a few ms,
 * below the stall radar, and not worth a worker roundtrip.
 */
const OFF_THREAD_PARSE_THRESHOLD_CHARS = 256 * 1024;

@Injectable()
export class ElectronApiRunner implements IApiRunner {
	// Mock properties to maintain compatibility with original ApiRunner
	public readonly http: any = null;
	public readonly ow: any = null;

	private offThreadJsonParser: OffThreadJsonParser | null = null;

	/**
	 * Offload JSON.parse of large API payloads (Plan G (b),
	 * docs/electron-memory-investigation.md): session 7 measured 5.3 s of
	 * parseJsonResponse on the main thread at match start (BG meta-hero stats).
	 * The fetch itself stays on main (net.fetch is async and keeps Chromium's
	 * HTTP cache / proxy behavior); only the parse moves.
	 */
	public setOffThreadJsonParser(parser: OffThreadJsonParser): void {
		this.offThreadJsonParser = parser;
	}

	/** Only for logged-in users */
	public async callPostApiSecure<T>(
		url: string,
		input: any,
		options?: {
			contentType?: string;
			bearerToken?: string;
		},
	): Promise<T | null> {
		// For now, mock the secure authentication and just call the regular API
		// TODO: Implement proper session token management for Electron
		console.log('[electron-api-runner] Mock secure call - using regular API for now');
		return this.callPostApi(url, input, options);
	}

	public async callPostApi<T>(
		url: string,
		input: any,
		options?: {
			contentType?: string;
			bearerToken?: string;
			userAgent?: string;
		},
		returnStatusCode = false,
	): Promise<T | null> {
		const postData = JSON.stringify(input);
		const headers: Record<string, string> = {
			'Content-Type': options?.contentType ?? 'application/json',
			...(options?.userAgent && { 'User-Agent': options.userAgent }),
			...(options?.bearerToken && { Authorization: `Bearer ${options.bearerToken}` }),
		};

		console.debug('[electron-api-runner] calling POST', url);
		try {
			const response = await this.executeRequest(url, {
				method: 'POST',
				headers: headers,
				body: postData,
			});
			const result = await this.parseJsonResponse<T>(response);
			console.debug('[electron-api-runner] retrieved POST call', url, result);
			return result;
		} catch (error) {
			console.warn('[electron-api-runner] Could not execute POST call', url, input, error);
			if (returnStatusCode) {
				throw (error as any)?.statusCode ?? (error as any)?.code ?? 500;
			}
			return null;
		}
	}

	// For JSON output
	public async callGetApi<T>(
		url: string,
		options?: {
			bearerToken?: string;
		},
	): Promise<T | null> {
		try {
			console.debug('[electron-api-runner] calling GET', url);
			const response = await this.executeRequest(url, {
				method: 'GET',
				headers: {
					...(options?.bearerToken && { Authorization: `Bearer ${options.bearerToken}` }),
				},
			});
			const result = await this.parseJsonResponse<T>(response);
			console.debug('[electron-api-runner] retrieved GET call', url);
			return result;
		} catch (error) {
			console.warn('[electron-api-runner] Could not execute GET call', url, error);
			return null;
		}
	}

	public async get(url: string, logError = true): Promise<string | undefined> {
		try {
			console.debug('[electron-api-runner] calling GET', url);
			const response = await this.executeRequest(url, { method: 'GET' });
			const result = await response.text();
			console.debug('[electron-api-runner] retrieved GET call', url);
			return result;
		} catch (error) {
			if (logError) {
				console.warn('[electron-api-runner] Could not execute GET call', url, error);
			}
			return undefined;
		}
	}

	private async executeRequest(url: string, options: ElectronApiRunnerRequestOptions): Promise<Response> {
		const response = await net.fetch(url, {
			method: options.method,
			headers: options.headers,
			body: options.body,
			cache: 'default',
		});
		if (!response.ok) {
			throw Object.assign(new Error(`HTTP ${response.status} for ${url}`), { statusCode: response.status });
		}
		return response;
	}

	private async parseJsonResponse<T>(response: Response): Promise<T | null> {
		const text = await response.text();
		if (!text?.length) {
			return null;
		}
		if (this.offThreadJsonParser && text.length >= OFF_THREAD_PARSE_THRESHOLD_CHARS) {
			const parsed = await this.offThreadJsonParser(text);
			if (parsed.ok) {
				return parsed.value as T;
			}
			// Offload failed (worker down / timed out): fall through to the local parse
		}
		// Stall-attribution hook installed by the platform instrumentation (no-op
		// otherwise): main-thread parses of large payloads are the thing Plan G (b)
		// is removing, so keep them measured
		const perfHook = (globalThis as any).__fsSlowOp;
		if (perfHook) {
			const start = performance.now();
			const result = JSON.parse(text) as T;
			perfHook('api', 'parse-json-main', performance.now() - start, { chars: text.length });
			return result;
		}
		return JSON.parse(text) as T;
	}

	// Mock methods for future implementation
	private async secureUserToken(): Promise<string> {
		// TODO: Implement proper Electron user authentication
		// For now, return a mock token or empty string
		console.log('[electron-api-runner] Mock secureUserToken - authentication not implemented yet');
		return '';
	}

	private async generateNewToken(): Promise<string | null> {
		// TODO: Implement proper token generation for Electron
		// This would need to integrate with Electron's user management system
		console.log('[electron-api-runner] Mock generateNewToken - authentication not implemented yet');
		return null;
	}
}
