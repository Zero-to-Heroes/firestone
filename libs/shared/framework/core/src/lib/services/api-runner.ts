import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtPayload, decode } from 'jsonwebtoken';
import { LocalStorageService } from './local-storage';
import { OverwolfService } from './overwolf.service';

const FIRESTONE_TOKEN_URL = 'https://xuzigy2zcqg6qxrdztvg42suae0skqkr.lambda-url.us-west-2.on.aws/';
@Injectable()
export class ApiRunner {
	constructor(
		private readonly http: HttpClient,
		private readonly ow: OverwolfService,
		private readonly localStorage: LocalStorageService,
	) {}

	/** Only for logged-in users */
	public async callPostApiSecure<T>(
		url: string,
		input: any,
		options?: {
			contentType?: string;
			bearerToken?: string;
		},
	): Promise<T | null> {
		const userToken = await this.secureUserToken();
		if (!userToken) {
			console.warn('Cannot call secure API without a valid token', url);
			return null;
		}

		input = {
			...input,
			jwt: userToken,
			isFirestoneToken: true,
		};
		return this.callPostApi(url, input, options);
	}

	public async callPostApi<T>(
		url: string,
		input: any,
		options?: {
			contentType?: string;
			bearerToken?: string;
		},
		returnStatusCode = false,
	): Promise<T | null> {
		return new Promise<T | null>((resolve, reject) => {
			let headers = new HttpHeaders({
				'Content-Type': options?.contentType ?? 'application/json',
			});
			if (options?.bearerToken) {
				headers = headers.set('Authorization', `Bearer ${options.bearerToken}`);
			}
			this.http.post(url, input, { headers: headers }).subscribe(
				(result: any) => {
					console.debug('retrieved POST call', url);
					resolve(result);
				},
				(error) => {
					if (error.status === 404) {
						console.warn('Could not execute POST call', url, input, error);
					} else {
						console.error('Could not execute POST call', url, input, error);
					}
					if (returnStatusCode) {
						reject(error.status);
					} else {
						resolve(null);
					}
				},
			);
		});
	}

	// For JSON output
	public async callGetApi<T>(url: string): Promise<T | null> {
		return new Promise<T | null>((resolve, reject) => {
			this.http.get(url).subscribe(
				(result: any) => {
					console.debug('retrieved GET call', url);
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

	public async get(url: string): Promise<string | undefined> {
		return this.http
			.get(url, {
				responseType: 'text',
			})
			.toPromise();
	}

	private async secureUserToken(): Promise<string> {
		let firestoneToken: string | null = this.localStorage.getItem<string>(
			LocalStorageService.FIRESTONE_SESSION_TOKEN,
		);
		console.debug('checking firestoneToken', firestoneToken);
		// If the token is valid, we can use it
		if (!!firestoneToken?.length) {
			const decoded: JwtPayload = decode(firestoneToken) as JwtPayload;
			console.debug('decoded', decoded);
			// Check if JWT token is expired
			if ((decoded.exp ?? 0) * 1000 < Date.now()) {
				firestoneToken = null;
			}
		}
		if (!firestoneToken) {
			firestoneToken = await this.generateNewToken();
			this.localStorage.setItem(LocalStorageService.FIRESTONE_SESSION_TOKEN, firestoneToken);
		}
		return firestoneToken as string;
	}

	private async generateNewToken(): Promise<string | null> {
		const currentUser = await this.ow.getCurrentUser();
		if (!currentUser?.username?.length) {
			return null;
		}

		const owToken = await this.ow.generateSessionToken();
		const fsToken: { fsToken: string } | null = await this.callPostApi(FIRESTONE_TOKEN_URL, { owToken: owToken });
		console.debug('fsToken', fsToken, !fsToken?.fsToken ? 'no decode' : decode(fsToken?.fsToken));
		return fsToken?.fsToken ?? null;
	}
}
