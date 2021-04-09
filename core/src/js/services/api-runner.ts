import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class ApiRunner {
	constructor(private readonly http: HttpClient) {}

	public async callPostApiWithRetries<T>(url: string, input: any, numberOfRetries = 1): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.callPostApiWithRetriesInternal(url, input, result => resolve(result), numberOfRetries);
		});
	}

	public async callPostApi<T>(
		url: string,
		input: any,
		options?: {
			contentType?: string;
			bearerToken?: string;
		},
	): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.callPostApiWithRetriesInternal(url, input, result => resolve(result), 1, options);
		});
	}

	private callPostApiWithRetriesInternal(
		url: string,
		input: any,
		callback,
		retriesLeft = 1,
		options?: {
			contentType?: string;
			bearerToken?: string;
		},
	) {
		if (retriesLeft <= 0) {
			console.error('Could not execute POST call after retries', url, input);
			callback(null);
			return;
		}
		let headers = new HttpHeaders({
			'Content-Type': options?.contentType ?? 'application/json',
		});
		if (options?.bearerToken) {
			headers = headers.set('Authorization', `Bearer ${options.bearerToken}`);
			console.debug('set authorization', headers, options.bearerToken);
		}
		this.http.post(url, input, { headers: headers }).subscribe(
			(result: any) => {
				console.log('retrieved POST call', url, input);
				callback(result);
			},
			error => {
				console.error('Could not execute POST call', url, input, error);
				setTimeout(
					() => this.callPostApiWithRetriesInternal(url, input, callback, retriesLeft - 1, options),
					2000,
				);
			},
		);
	}

	public async callGetApiWithRetries<T>(url: string, numberOfRetries = 1): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.callGetApiWithRetriesInternal(url, result => resolve(result), numberOfRetries);
		});
	}

	private callGetApiWithRetriesInternal(url: string, callback, retriesLeft = 1) {
		if (retriesLeft <= 0) {
			console.error('Could not execute GET call', url);
			callback(null);
			return;
		}
		this.http.get(url).subscribe(
			(result: any) => {
				console.log('retrieved GET call', url);
				callback(result);
			},
			error => {
				setTimeout(() => this.callGetApiWithRetriesInternal(url, callback, retriesLeft - 1), 2000);
			},
		);
	}
}
