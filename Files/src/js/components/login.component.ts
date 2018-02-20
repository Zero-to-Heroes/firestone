import { Component, Output, EventEmitter } from '@angular/core';
import { Http, Headers, RequestOptions, RequestOptionsArgs } from "@angular/http";
import { Observable, ObservableInput } from 'rxjs/Observable';

import { LocalStorageService } from 'angular-2-local-storage';

import { Events } from '../services/events.service';
import { OwNotificationsService } from '../services/notifications.service';
import { HearthHeadSyncService } from '../services/collection/hearthhead-sync.service';

declare var overwolf: any;

@Component({
	selector: 'login',
	styleUrls: [
		`../../css/global/components-global.scss`,
		`../../css/component/login.component.scss`,
	],
	// See https://stackoverflow.com/questions/45216306/angular-4-email-validator-in-formgroup to improve the design
	template: `
		<div class="login-container">
			<div class="modal modal-connect active">
				<div class="modal-window modal-window-connect">
					<section class="sign-in-section">
						<aside class="modal-window-connect-aside">
							<img alt="HearthHead logo placeholder" />
							<h1>HearthHead <br>Sign in</h1>

							<p class="subtext">Sign in to HearthHead to sync your collection online</p>
							<p class="error-message" *ngIf="errorMessage">{{errorMessage}}</p>
						</aside>

						<form #signInForm="ngForm">
							<section class="form-section">
								<label for="login_field"><span>Email</span></label>
								<input class="input-text" id="login_field" name="identifier" tabindex="1" type="text" [(ngModel)]="identifier">
							</section>

							<section class="form-section">
								<label for="password">
									<span>Password</span>
									<a class="label-link" target="_blank" href="http://www.hearthhead.com/forgot">Forgot password?</a>
								</label>
								<input class="input-text" id="password" name="password" tabindex="2" type="password" [(ngModel)]="password">
							</section>

							<button type="submit" class="btn" tabindex="3" (click)="login()">
								<span class="Button-Content" tabindex="-1">Sign in</span>
							</button>
							<p>Don't have an account? <a class="switch-to-sign-up text-link" target="_blank" href="https://www.hearthhead.com/register">Sign up</a></p>
						</form>
					</section>

					<button class="window-control window-control-close" (click)="closeWindow()">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#window-control_close" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	`,
})
export class LoginComponent {


	@Output() close = new EventEmitter();

	private errorMessage: string;

	private identifier: string;
	private password: string;

	constructor(
		private http: Http,
		private sync: HearthHeadSyncService,
		private localStorageService: LocalStorageService,
		private notificationService: OwNotificationsService,
		private events: Events) {

	}

	private login() {
		this.errorMessage = null;
		// this.infoMessage = 'Working on it';
		console.log('logging in with', this.identifier, this.password);
		this.sync.login(this.identifier, this.password, () => {
			this.notificationService.html('<div class="message-container"><img src="/IconStore.png"><div class="message">You\'re logged in to Hearthhead, we\'re now syncing your collection</div></div>');
			console.log('logged in, syncing collection');
			this.closeWindow();
			this.sync.sync(() => {
				console.log('sync successful');
				this.notificationService.html('<div class="message-container"><img src="/IconStore.png"><div class="message">Your collection is now fully synced with Hearthhead</div></div>');
			});
		});
	}

	private closeWindow() {
		this.close.emit(null);
	}
}
