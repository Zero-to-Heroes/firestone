import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { combineLatest, filter, from, merge, switchMap, tap, withLatestFrom } from 'rxjs';

import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Store } from '@ngrx/store';
import { ProfileLoadDataService } from 'libs/profile/data-access/src/lib/profile-load-data.service';
import * as WebsiteProfileActions from './pofile.actions';
import { ExtendedProfileSet, WebsiteProfileState } from './profile.models';

@Injectable()
export class WebsiteProfileEffects {
	private collectibleCards: readonly ReferenceCard[];

	constructor(
		private readonly actions$: Actions,
		private readonly access: ProfileLoadDataService,
		private readonly store: Store<WebsiteProfileState>,
		private readonly allCards: CardsFacadeService,
	) {}

	ownProfile$ = createEffect(() => {
		const params$ = combineLatest([
			from([1]), // Not used, just to avoid having to redo everyth
		]);
		const merged$ = merge(this.actions$.pipe(ofType(WebsiteProfileActions.initOwnProfileData)), params$);
		return merged$.pipe(
			tap((info) => console.debug('ownProfile info', info)),
			withLatestFrom(params$),
			tap((info) => console.debug('ownProfile info 2', info)),
			filter(([action, params]) => !!action || !!params),
			tap((info) => console.debug('ownProfile info 3', info)),
			switchMap(async ([action]) => {
				// TODO: get the current user token and pass it
				console.debug('will load own profile data', action);
				const profile = await this.access.loadOwnProfileData('fake');
				console.debug('loaded own profile data', profile);
				if (!this.collectibleCards?.length) {
					this.collectibleCards = await this.allCards.getCards().filter((c) => c.collectible);
				}
				const sets: readonly ExtendedProfileSet[] =
					profile?.sets?.map((set) => {
						return {
							...set,
							totalCollectibleCards: this.collectibleCards
								.filter((c) => c.set?.toLowerCase() === set.id)
								.map((c) => (c.rarity === 'Legendary' ? 1 : 2))
								.reduce((a, b) => a + b, 0),
							global: {
								...set.global,
								totalCollectedCards:
									set.global.common + set.global.epic + set.global.legendary + set.global.rare,
							},
							golden: {
								...set.golden,
								totalCollectedCards:
									set.golden.common + set.golden.epic + set.golden.legendary + set.golden.rare,
							},
						};
					}) ?? [];
				return WebsiteProfileActions.loadProfileDataSuccess({
					sets: sets,
				});
			}),
		);
	});

	// profile$ = createEffect(() => {
	// 	const params$ = combineLatest([
	// 		from([1]), // Not used, just to avoid having to redo everyth
	// 	]);
	// 	const merged$ = merge(this.actions$.pipe(ofType(WebsiteProfileActions.initProfileData)), params$);
	// 	return merged$.pipe(
	// 		withLatestFrom(params$),
	// 		filter(([action, params]) => !!action || !!params),
	// 		switchMap(async ([action, params]) => {
	// 			const profile = await this.access.loadProfileData(action.userName);
	// 			return WebsiteProfileActions.loadProfileDataSuccess({
	// 				profile: profile,
	// 			});
	// 		}),
	// 	);
	// });
}
