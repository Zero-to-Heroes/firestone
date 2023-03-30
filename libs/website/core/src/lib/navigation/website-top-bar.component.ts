import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { initAuthentication } from '../+state/website/core.actions';
import { WebsiteCoreState } from '../+state/website/core.models';

@Component({
	selector: 'website-top-bar',
	styleUrls: [`./website-top-bar.component.scss`],
	template: `
		<nav class="top-bar">
			<div class="logo" inlineSVG="assets/svg/firestone_logo_full.svg"></div>
			<button class="login-button" (click)="login()">Login with Overwolf</button>
		</nav>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteTopBarComponent extends AbstractSubscriptionComponent {
	clientId = ``;
	redirectUri = ``;
	loginUrl = `https://accounts.overwolf.com/oauth2/auth?response_type=code&client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=openid+profile+email`;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: TranslateService,
		private readonly store: Store<WebsiteCoreState>,
		private readonly router: Router,
	) {
		super(cdr);
	}

	login() {
		window.open(this.loginUrl, '_blank')?.focus();
		const action = initAuthentication({ userName: 'fakeUserName' });
		this.store.dispatch(action);
		this.router.navigate(['/battlegrounds']);
	}
}
