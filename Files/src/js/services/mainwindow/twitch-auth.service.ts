import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Message, OwNotificationsService } from '../notifications.service';
import { PreferencesService } from '../preferences.service';

const EBS_URL = 'https://ebs.firestoneapp.com/deck/event';
// const EBS_URL = 'http://ec2-52-42-105-37.us-west-2.compute.amazonaws.com/deck/event';
// const EBS_URL = 'http://localhost:8081/deck/event';

const CLIENT_ID = 'jbmhw349lqbus9j8tx4wac18nsja9u';
const REDIRECT_URI = 'overwolf-extension://lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob/Files/twitch-auth-callback.html';
const SCOPES = 'channel_read';
const LOGIN_URL = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${SCOPES}`;
const TWITCH_VALIDATE_URL = 'https://id.twitch.tv/oauth2/validate';
const TWITCH_USER_URL = 'https://api.twitch.tv/helix/users';

@Injectable()
export class TwitchAuthService {
	public stateUpdater = new EventEmitter<any>();

	constructor(
		private prefs: PreferencesService,
		private http: HttpClient,
		private notificationService: OwNotificationsService,
	) {
		window['twitchAuthUpdater'] = this.stateUpdater;

		this.stateUpdater.subscribe((twitchInfo: any) => {
			console.log('[twitch-auth] received access token', twitchInfo);
			this.saveAccessToken(twitchInfo.access_token);
		});
		console.log('[twitch-auth] handler init done');
	}

	public async emitDeckEvent(event: any) {
		// console.log('ready to emit twitch event');
		const prefs = await this.prefs.getPreferences();
		if (!prefs.twitchAccessToken) {
			// console.log('no twitch access token, returning');
			return;
		}
		const httpHeaders: HttpHeaders = new HttpHeaders().set('Authorization', `Bearer ${prefs.twitchAccessToken}`);
		this.http.post(EBS_URL, event, { headers: httpHeaders }).subscribe(
			() => {
				// Do nothing
				// console.log('twitch event result', data);
			},
			error => {
				console.error('[twitch-auth] Could not send deck event to EBS', error);
			},
		);
	}

	public buildLoginUrl(): string {
		return LOGIN_URL;
	}

	public async sendExpiredTwitchTokenNotification() {
		console.log('[twitch-auth] Sending expired token notification');
		const content = `
			<div class="achievement-message-container">
				<div class="message">
					<div class="title">
						<span>We couldn't log you into your Twitch account</span>
					</div>
					<div class="recap-text">
						<span>Please go to the settings and reconnect to your Twitch account</span>
					</div>
				</div>
				<button class="i-30 close-button">
					<svg class="svg-icon-fill">
						<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
					</svg>
				</button>
			</div>`;
		this.notificationService.html({
			notificationId: 'expired-token-notif-' + new Date().getTime(),
			content: content,
			type: 'expired-token-notif',
			timeout: 10000,
		} as Message);
	}

	public async isLoggedIn(): Promise<boolean> {
		const prefs = await this.prefs.getPreferences();
		// Never added an access token
		if (!prefs.twitchAccessToken) {
			return false;
		}
		// Handle expired tokens?
		const isTokenValid = await this.validateToken(prefs.twitchAccessToken);
		return isTokenValid;
	}

	public async validateToken(accessToken: string): Promise<boolean> {
		return new Promise<boolean>(resolve => {
			const httpHeaders: HttpHeaders = new HttpHeaders().set('Authorization', `OAuth ${accessToken}`);
			this.http.get(TWITCH_VALIDATE_URL, { headers: httpHeaders }).subscribe(
				data => {
					console.log('[twitch-auth] validating token', data);
					resolve(true);
				},
				() => {
					console.log('[twitch-auth] invalid token', accessToken);
					resolve(false);
				},
			);
		});
	}

	private async retrieveUserName(accessToken: string): Promise<boolean> {
		return new Promise<boolean>(resolve => {
			const httpHeaders: HttpHeaders = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);
			this.http.get(TWITCH_USER_URL, { headers: httpHeaders }).subscribe(
				(data: any) => {
					console.log('[twitch-auth] received user info', data);
					this.prefs.setTwitchUserName(data.data && data.data.length > 0 && data.data[0].display_name);
				},
				() => {
					resolve(false);
				},
			);
		});
	}

	private async saveAccessToken(accessToken: string) {
		await this.validateToken(accessToken);
		await this.prefs.setTwitchAccessToken(accessToken);
		await this.retrieveUserName(accessToken);
	}
}
