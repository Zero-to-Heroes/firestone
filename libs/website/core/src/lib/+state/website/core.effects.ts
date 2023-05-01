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
			ofType(WebsiteCoreActions.authenticationSuccess),
			switchMap(async (action) => {
				const existingPrefs = this.prefs.getPreferences();
				const newPrefs: WebsitePreferences = {
					...existingPrefs,
					premium: {
						expires: action.expiration,
						isPremium: action.isLoggedIn && action.isPremium,
						fsToken: action.fsToken,
						picture: action.picture,
						userName: action.userName,
						nickName: action.nickName,
					},
				};
				console.debug('updated prefs', newPrefs);
				this.prefs.savePreferences(newPrefs);

				return WebsiteCoreActions.afterAuthentication({
					userName: action.userName,
					nickName: action.nickName,
					picture: action.picture,
					fsToken: action.fsToken,
					isLoggedIn: true,
					isPremium: action.isPremium,
				});
			}),
		),
	);
}
