import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { combineLatest, filter, ignoreElements, map, merge, switchMap, tap, withLatestFrom } from 'rxjs';

import { Router } from '@angular/router';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { WebsiteCoreState, WebsitePreferences, WebsitePreferencesService, getFsToken } from '@firestone/website/core';
import { Store } from '@ngrx/store';
import { ProfileLoadDataService } from 'libs/profile/data-access/src/lib/profile-load-data.service';
import * as WebsiteProfileActions from './pofile.actions';
import { ExtendedProfileSet, WebsiteProfileState } from './profile.models';
import { getSets } from './profile.selectors';

@Injectable()
export class WebsiteProfileEffects {
	private collectibleCards: readonly ReferenceCard[];

	constructor(
		private readonly actions$: Actions,
		private readonly access: ProfileLoadDataService,
		private readonly store: Store<WebsiteProfileState>,
		private readonly coreStore: Store<WebsiteCoreState>,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: WebsitePreferencesService,
		private readonly router: Router,
	) {}

	ownProfile$ = createEffect(() => {
		const params$ = combineLatest([this.coreStore.select(getFsToken)]);
		const hasInfo$ = combineLatest([this.store.select(getSets)]).pipe(map(([sets]) => !!sets?.length));
		const merged$ = merge(this.actions$.pipe(ofType(WebsiteProfileActions.initOwnProfileData)), params$);
		return merged$.pipe(
			withLatestFrom(params$, hasInfo$),
			filter(([action, params, hasInfo]) => !hasInfo),
			filter(([action, params, hasInfo]) => !!action || !!params),
			switchMap(async ([action, [fsToken]]) => {
				const profile = await this.access.loadOwnProfileData(fsToken);
				if (!this.collectibleCards?.length) {
					this.collectibleCards = this.allCards.getCards()?.filter((c) => c.collectible);
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
					shareAlias: profile?.shareAlias ?? null,
				});
			}),
		);
	});

	otherProfile$ = createEffect(() => {
		const hasInfo$ = combineLatest([this.store.select(getSets)]).pipe(map(([sets]) => !!sets?.length));
		return this.actions$.pipe(ofType(WebsiteProfileActions.initOtherProfileData)).pipe(
			withLatestFrom(hasInfo$),
			filter(([action, hasInfo]) => !hasInfo),
			filter(([action, hasInfo]) => !!action),
			switchMap(async ([action]) => {
				const profile = await this.access.loadOtherProfileData(action.shareAlias);
				if (!this.collectibleCards?.length) {
					this.collectibleCards = this.allCards.getCards()?.filter((c) => c.collectible);
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
				return WebsiteProfileActions.loadOtherProfileDataSuccess({
					sets: sets,
				});
			}),
		);
	});

	stopWatching$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(WebsiteProfileActions.stopWatchingOtherProfile),
			tap(() => this.router.navigate(['profile'])),
			ignoreElements(),
			map(() => null as any),
		);
	});

	shareProfile$ = createEffect(() => {
		return this.actions$.pipe(ofType(WebsiteProfileActions.shareProfile)).pipe(
			withLatestFrom(this.coreStore.select(getFsToken)),
			switchMap(async ([action, fsToken]) => {
				const shareAlias: string = (action as any).shareAlias;
				try {
					const aliasResult: string | null = await this.access.shareOwnProfile(fsToken, shareAlias);
					const prefs = this.prefs.getPreferences();
					const newPrefs: WebsitePreferences = { ...prefs, shareAlias: aliasResult as string };
					this.prefs.savePreferences(newPrefs);
					return WebsiteProfileActions.shareProfileSuccess({
						shareAlias: aliasResult ?? null,
					});
				} catch (e) {
					console.debug('could not share profile', e);
					return WebsiteProfileActions.shareProfileFailure({
						errorCode: e as number,
					});
				}
			}),
		);
	});

	unshareProfile$ = createEffect(() => {
		return this.actions$.pipe(ofType(WebsiteProfileActions.startProfileUnshare)).pipe(
			withLatestFrom(this.coreStore.select(getFsToken)),
			switchMap(async ([action, fsToken]) => {
				await this.access.unshareOwnProfile(fsToken);
				const prefs = this.prefs.getPreferences();
				const newPrefs: WebsitePreferences = { ...prefs, shareAlias: null };
				this.prefs.savePreferences(newPrefs);
				return WebsiteProfileActions.unshareProfileSuccess();
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
