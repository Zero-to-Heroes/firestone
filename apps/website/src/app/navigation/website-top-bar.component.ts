/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { WebsiteLocalizationService } from '@firestone/website/core';
import { Store } from '@ngrx/store';
import { stopWatchingOtherProfile } from 'libs/website/profile/src/lib/+state/website/pofile.actions';
import { WebsiteProfileState } from 'libs/website/profile/src/lib/+state/website/profile.models';
import { getWatchingOtherPlayer } from 'libs/website/profile/src/lib/+state/website/profile.selectors';
import { Observable } from 'rxjs';
import { WebsiteCoreState } from '../../../../../libs/website/core/src/lib/+state/website/core.models';
import { getPremium } from '../../../../../libs/website/core/src/lib/+state/website/core.selectors';
import {
	AuthenticationService,
	loginUrl,
} from '../../../../../libs/website/core/src/lib/security/authentication.service';

@Component({
	selector: 'website-top-bar',
	styleUrls: [`./website-top-bar.component.scss`],
	template: `
		<nav class="top-bar">
			<div class="logo" inlineSVG="assets/svg/firestone_logo_full.svg"></div>
			<div class="watching-other-profile-banner" *ngIf="watchingOtherProfile$ | async as shareAlias">
				<div class="text">You are watching {{ shareAlias }}'s profile</div>
				<div
					class="close-button"
					(click)="stopWatching()"
					inlineSVG="assets/svg/close.svg"
					[helpTooltip]="closeButtonHelpTooltip$ | async"
				></div>
			</div>
			<button class="login-button" *ngIf="!(premium$ | async)" (click)="login()">Login with Overwolf</button>
			<button class="login-button" *ngIf="premium$ | async" (click)="logout()">Logout</button>
		</nav>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteTopBarComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	premium$: Observable<boolean | undefined>;
	watchingOtherProfile$: Observable<string | undefined>;
	closeButtonHelpTooltip$: Observable<string | undefined>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly store: Store<WebsiteCoreState>,
		private readonly profileStore: Store<WebsiteProfileState>,
		private readonly auth: AuthenticationService,
		private readonly router: Router,
		private readonly i18n: WebsiteLocalizationService,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.premium$ = this.store.select(getPremium);
		this.watchingOtherProfile$ = this.profileStore.select(getWatchingOtherPlayer);
		this.closeButtonHelpTooltip$ = this.profileStore
			.select(getWatchingOtherPlayer)
			.pipe(
				this.mapData((alias) =>
					this.i18n.translateString('website.spectator.close-button-tooltip', { playerName: alias }),
				),
			);
	}

	stopWatching() {
		this.profileStore.dispatch(stopWatchingOtherProfile());
	}

	login() {
		window.open(loginUrl, '_blank')?.focus();
	}

	logout() {
		this.auth.logout();
		// TODO: how to refresh the guard automatically based on the state?
		this.router.navigate(['/premium']);
	}
}
