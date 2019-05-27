import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { PreferencesService } from '../preferences.service';

const EBS_URL = 'https://twitch.firestoneapp.com/deck/event';
// const EBS_URL = 'http://localhost:8081/deck/event';

const CLIENT_ID = 'cdbnfn27sed3s2n6kyj331lky9gx73';
const REDIRECT_URI = 'overwolf-extension://lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob/Files/html/twitch-auth-callback.html';
const LOGIN_URL = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=channel_read`;
const TWITCH_VALIDATE_URL = 'https://id.twitch.tv/oauth2/validate';

@Injectable()
export class TwitchAuthService {

    public stateUpdater = new EventEmitter<any>();

	constructor(private prefs: PreferencesService, private http: HttpClient) {
        console.log('assigning updater', this.stateUpdater);
        window['twitchAuthUpdater'] = this.stateUpdater;

		this.stateUpdater.subscribe((twitchInfo: any) => {
            console.log('received access token', twitchInfo);
            this.saveAccessToken(twitchInfo.access_token, twitchInfo.id_token);
        });
        console.log('twitch auth handler init done');
    }

    public async emitDeckEvent(event: any) {
        console.log('ready to emit twitch event');
        const prefs = await this.prefs.getPreferences();
        if (!prefs.twitchAccessToken) {
            console.log('no twitch access token, returning');
            return;
        }
        const httpHeaders: HttpHeaders = new HttpHeaders()
                .set('Authorization', `Bearer ${prefs.twitchAccessToken}`);
        console.log('sending event');
        this.http.post(EBS_URL, event, { headers: httpHeaders} ).subscribe((data) => {
            // Do nothing
            console.log('twitch event result', data);
        }, (error) => {
            console.error('Could not send deck event to EBS', error);
        });
    }

    public buildLoginUrl(): string {
        return LOGIN_URL;
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

    private async validateToken(accessToken: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
            const httpHeaders: HttpHeaders = new HttpHeaders()
                    .set('Authorization', `OAuth ${accessToken}`);
            this.http.get(TWITCH_VALIDATE_URL, { headers: httpHeaders} ).subscribe((data) => {
                resolve(true);
            }, (error) => {
                resolve(false);
            });
        });
    }
    
    private async saveAccessToken(accessToken: string, idToken: string) {
        await this.prefs.setTwitchAccessToken(accessToken);
    }
}
