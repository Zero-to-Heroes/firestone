import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class ApiRunner {
	constructor(private readonly http: HttpClient) {}

	public async callPostApi<T>(
		url: string,
		input: any,
		options?: {
			contentType?: string;
			bearerToken?: string;
		},
	): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			let headers = new HttpHeaders({
				'Content-Type': options?.contentType ?? 'application/json',
			});
			if (options?.bearerToken) {
				headers = headers.set('Authorization', `Bearer ${options.bearerToken}`);
			}
			this.http.post(url, input, { headers: headers }).subscribe(
				(result: any) => {
					console.log('retrieved POST call', url);
					resolve(result);
				},
				(error) => {
					if (error.status === 404) {
						console.warn('Could not execute POST call', url, input, error);
					} else {
						console.error('Could not execute POST call', url, input, error);
					}
					resolve(null);
				},
			);
		});
	}

	// For JSON output
	public async callGetApi<T>(url: string): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.http.get(url).subscribe(
				(result: any) => {
					console.log('retrieved GET call', url);
					resolve(result);
				},
				(error) => {
					// Some users have a VPN / ISP config that prevents them from accessing our static
					// data, so there's nothing we can do unless they contact us directly
					// We still log an error though, because it can be useful when debugging other things
					console.error('Could not execute GET call', url, error);
					resolve(null);
				},
			);
		});
	}

	public async get(url: string): Promise<string> {
		return this.http
			.get(url, {
				responseType: 'text',
			})
			.toPromise();
	}
}
