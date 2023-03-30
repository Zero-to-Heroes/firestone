import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap } from 'rxjs';
import { WebsitePreferences } from '../../preferences/website-preferences';
import { WebsitePreferencesService } from '../../preferences/website-preferences.service';
import { AuthenticationService } from '../../security/authentication.service';

import * as WebsiteCoreActions from './core.actions';

@Injectable()
export class WebsiteCoreEffects {
	private actions$ = inject(Actions);

	constructor(private readonly auth: AuthenticationService, private readonly prefs: WebsitePreferencesService) {}

	checkPremium$ = createEffect(() =>
		this.actions$.pipe(
			ofType(WebsiteCoreActions.initAuthentication),
			switchMap(async (action) => {
				console.log('will chekc premium status for', action.userName);
				const isPremium = await this.auth.checkPremium(action.userName);
				const existingPrefs = this.prefs.getPreferences();
				const newPrefs: WebsitePreferences = {
					...existingPrefs,
					premium: {
						lastUpdateDate: new Date().toISOString(),
						isPremium: isPremium,
					},
				};
				console.debug('updated prefs', newPrefs);
				this.prefs.savePreferences(newPrefs);

				return WebsiteCoreActions.authenticationSuccess({
					userName: action.userName,
					isLoggedIn: true,
					isPremium: isPremium,
				});
			}),
		),
	);
}
