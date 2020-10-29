import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class ApiRunner {
	constructor(private readonly http: HttpClient) {}

	public async callPostApiWithRetries<T>(url: string, input: any, numberOfRetries = 1): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.callPostApiWithRetriesInternal(url, input, result => resolve(result), numberOfRetries);
		});
	}

	private callPostApiWithRetriesInternal(url: string, input: any, callback, retriesLeft = 1) {
		if (retriesLeft <= 0) {
			console.error('Could not execute POST call', url, input);
			callback(null);
			return;
		}
		this.http.post(url, input).subscribe(
			(result: any) => {
				console.log('retrieved POST call', url, input);
				callback(result);
			},
			error => {
				setTimeout(() => this.callPostApiWithRetriesInternal(url, input, callback, retriesLeft - 1), 2000);
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
