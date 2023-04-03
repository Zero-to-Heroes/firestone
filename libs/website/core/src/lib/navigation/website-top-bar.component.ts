/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { WebsiteCoreState } from '../+state/website/core.models';
import { getPremium } from '../+state/website/core.selectors';
import { AuthenticationService, loginUrl } from '../security/authentication.service';

@Component({
	selector: 'website-top-bar',
	styleUrls: [`./website-top-bar.component.scss`],
	template: `
		<nav class="top-bar">
			<div class="logo" inlineSVG="assets/svg/firestone_logo_full.svg"></div>
			<button class="login-button" *ngIf="!(premium$ | async)" (click)="login()">Login with Overwolf</button>
			<button class="login-button" *ngIf="premium$ | async" (click)="logout()">Logout</button>
		</nav>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteTopBarComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	premium$: Observable<boolean | undefined>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly store: Store<WebsiteCoreState>,
		private readonly auth: AuthenticationService,
		private readonly router: Router,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.premium$ = this.store.select(getPremium);
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
