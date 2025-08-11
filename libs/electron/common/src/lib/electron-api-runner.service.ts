import { Injectable } from '@angular/core';
import { IApiRunner } from './electron-api-runner.interface';

@Injectable()
export class ElectronApiRunner implements IApiRunner {
	// Mock properties to maintain compatibility with original ApiRunner
	public readonly http: any = null;
	public readonly ow: any = null;

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
		return new Promise<T | null>((resolve, reject) => {
			// Use Node.js https/http modules for HTTP requests
			const https = require('https');
			const http = require('http');
			const { URL } = require('url');
			const zlib = require('zlib');

			try {
				const parsedUrl = new URL(url);
				const isHttps = parsedUrl.protocol === 'https:';
				const httpModule = isHttps ? https : http;

				const postData = JSON.stringify(input);
				const requestOptions = {
					hostname: parsedUrl.hostname,
					port: parsedUrl.port || (isHttps ? 443 : 80),
					path: parsedUrl.pathname + parsedUrl.search,
					method: 'POST',
					headers: {
						'Content-Type': options?.contentType ?? 'application/json',
						'Content-Length': Buffer.byteLength(postData),
						'Accept-Encoding': 'gzip, deflate',
						...(options?.userAgent && { 'User-Agent': options.userAgent }),
						...(options?.bearerToken && { Authorization: `Bearer ${options.bearerToken}` }),
					},
				};

				console.debug('[electron-api-runner] calling POST', url);

				const req = httpModule.request(requestOptions, (res: any) => {
					const chunks: Buffer[] = [];
					const contentEncoding = res.headers['content-encoding'];

					res.on('data', (chunk: Buffer) => {
						chunks.push(chunk);
					});

					res.on('end', () => {
						try {
							const buffer = Buffer.concat(chunks as any);
							let decompressedData: string;

							if (contentEncoding === 'gzip') {
								decompressedData = zlib.gunzipSync(buffer).toString('utf8');
							} else if (contentEncoding === 'deflate') {
								decompressedData = zlib.inflateSync(buffer).toString('utf8');
							} else {
								decompressedData = buffer.toString('utf8');
							}

							const result = JSON.parse(decompressedData);
							console.debug('[electron-api-runner] retrieved POST call', url, result);
							resolve(result);
						} catch (parseError) {
							console.error('[electron-api-runner] Error parsing response', parseError);
							if (returnStatusCode) {
								reject(res.statusCode);
							} else {
								resolve(null);
							}
						}
					});
				});

				req.on('error', (error: any) => {
					if (returnStatusCode) {
						reject(error.code || 500);
					} else {
						console.warn('[electron-api-runner] Could not execute POST call', url, input, error);
						resolve(null);
					}
				});

				req.write(postData);
				req.end();
			} catch (error) {
				console.error('[electron-api-runner] Error setting up POST request', error);
				if (returnStatusCode) {
					reject(500);
				} else {
					resolve(null);
				}
			}
		});
	}

	// For JSON output
	public async callGetApi<T>(
		url: string,
		options?: {
			bearerToken?: string;
		},
	): Promise<T | null> {
		return new Promise<T | null>((resolve, reject) => {
			// Use Node.js https/http modules for HTTP requests
			const https = require('https');
			const http = require('http');
			const { URL } = require('url');
			const zlib = require('zlib');

			try {
				const parsedUrl = new URL(url);
				const isHttps = parsedUrl.protocol === 'https:';
				const httpModule = isHttps ? https : http;

				const requestOptions = {
					hostname: parsedUrl.hostname,
					port: parsedUrl.port || (isHttps ? 443 : 80),
					path: parsedUrl.pathname + parsedUrl.search,
					method: 'GET',
					headers: {
						'Accept-Encoding': 'gzip, deflate',
						...(options?.bearerToken && { Authorization: `Bearer ${options.bearerToken}` }),
					},
				};

				console.debug('[electron-api-runner] calling GET', url);

				const req = httpModule.request(requestOptions, (res: any) => {
					const chunks: Buffer[] = [];
					const contentEncoding = res.headers['content-encoding'];

					res.on('data', (chunk: Buffer) => {
						chunks.push(chunk);
					});

					res.on('end', () => {
						try {
							const buffer = Buffer.concat(chunks as any);
							let decompressedData: string;

							if (contentEncoding === 'gzip') {
								decompressedData = zlib.gunzipSync(buffer).toString('utf8');
							} else if (contentEncoding === 'deflate') {
								decompressedData = zlib.inflateSync(buffer).toString('utf8');
							} else {
								decompressedData = buffer.toString('utf8');
							}

							const result = JSON.parse(decompressedData);
							console.debug('[electron-api-runner] retrieved GET call', url);
							resolve(result);
						} catch (parseError) {
							console.warn('[electron-api-runner] Could not parse GET response', url, parseError);
							resolve(null);
						}
					});
				});

				req.on('error', (error: any) => {
					console.warn('[electron-api-runner] Could not execute GET call', url, error);
					resolve(null);
				});

				req.end();
			} catch (error) {
				console.error('[electron-api-runner] Error setting up GET request', error);
				resolve(null);
			}
		});
	}

	public async get(url: string, logError = true): Promise<string | undefined> {
		return new Promise<string | undefined>((resolve, reject) => {
			// Use Node.js https/http modules for HTTP requests
			const https = require('https');
			const http = require('http');
			const { URL } = require('url');
			const zlib = require('zlib');

			try {
				const parsedUrl = new URL(url);
				const isHttps = parsedUrl.protocol === 'https:';
				const httpModule = isHttps ? https : http;

				const requestOptions = {
					hostname: parsedUrl.hostname,
					port: parsedUrl.port || (isHttps ? 443 : 80),
					path: parsedUrl.pathname + parsedUrl.search,
					method: 'GET',
					headers: {
						'Accept-Encoding': 'gzip, deflate',
					},
				};

				console.debug('[electron-api-runner] calling GET', url);

				const req = httpModule.request(requestOptions, (res: any) => {
					const chunks: Buffer[] = [];
					const contentEncoding = res.headers['content-encoding'];

					res.on('data', (chunk: Buffer) => {
						chunks.push(chunk);
					});

					res.on('end', () => {
						try {
							const buffer = Buffer.concat(chunks as any);
							let decompressedData: string;

							if (contentEncoding === 'gzip') {
								decompressedData = zlib.gunzipSync(buffer).toString('utf8');
							} else if (contentEncoding === 'deflate') {
								decompressedData = zlib.inflateSync(buffer).toString('utf8');
							} else {
								decompressedData = buffer.toString('utf8');
							}

							console.debug('[electron-api-runner] retrieved GET call', url);
							resolve(decompressedData);
						} catch (decompressError) {
							if (logError) {
								console.warn(
									'[electron-api-runner] Error decompressing response',
									url,
									decompressError,
								);
							}
							// Fallback to raw buffer if decompression fails
							resolve(Buffer.concat(chunks as any).toString('utf8'));
						}
					});
				});

				req.on('error', (error: any) => {
					if (logError) {
						console.warn('[electron-api-runner] Could not execute GET call', url, error);
					}
					resolve(undefined);
				});

				req.end();
			} catch (error) {
				if (logError) {
					console.error('[electron-api-runner] Error setting up GET request', error);
				}
				resolve(undefined);
			}
		});
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
