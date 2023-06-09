import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Profile } from '@firestone-hs/api-user-profile';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { AchievementsRefLoaderService, HsRefAchiementsData } from '@firestone/achievements/data-access';
import { ProfileLoadDataService } from '@firestone/profile/data-access';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import {
	WebsiteCoreState,
	WebsiteLocalizationService,
	WebsitePreferences,
	WebsitePreferencesService,
	getFsToken,
} from '@firestone/website/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { combineLatest, filter, ignoreElements, map, merge, switchMap, tap, withLatestFrom } from 'rxjs';
import * as WebsiteProfileActions from './pofile.actions';
import {
	ExtendedProfile,
	ExtendedProfileAchievementCategory,
	ExtendedProfileSet,
	WebsiteProfileState,
} from './profile.models';
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
		private readonly refAchievements: AchievementsRefLoaderService,
		private readonly i18n: WebsiteLocalizationService,
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
				// console.debug('loading profile data', fsToken, action);
				if (!this.collectibleCards?.length) {
					this.collectibleCards = this.allCards.getCards()?.filter((c) => c.collectible);
				}

				const [profile, achievementsRefData] = await Promise.all([
					this.access.loadOwnProfileData(fsToken),
					this.refAchievements.loadRefData(),
				]);
				const extendedProfile = this.buildExtendedProfile(profile, achievementsRefData);
				return WebsiteProfileActions.loadProfileDataSuccess({
					profile: extendedProfile,
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
				if (!this.collectibleCards?.length) {
					this.collectibleCards = this.allCards.getCards()?.filter((c) => c.collectible);
				}

				const [profile, achievementsRefData] = await Promise.all([
					this.access.loadOtherProfileData(action.shareAlias),
					this.refAchievements.loadRefData(),
				]);
				const extendedProfile = this.buildExtendedProfile(profile, achievementsRefData);
				return WebsiteProfileActions.loadOtherProfileDataSuccess({
					profile: extendedProfile,
				});
			}),
		);
	});

	stopWatching$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(WebsiteProfileActions.stopWatchingOtherProfile),
			tap(() => this.router.navigate(['/profile'])),
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

	private buildExtendedProfile(
		profile: Profile | null,
		achievementsRefData: HsRefAchiementsData | null,
	): ExtendedProfile {
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
		const achievementCategories: ExtendedProfileAchievementCategory[] =
			profile?.achievementCategories?.map((category) => {
				const refCategory = achievementsRefData?.categories?.find((ref) => ref.id === category.id);
				return {
					...category,
					empty: category.totalAchievements === 0,
					complete: category.completedAchievements === category.totalAchievements,
					displayName:
						refCategory?.locales?.find((loc) => loc.locale === this.i18n.locale)?.name ??
						refCategory?.name ??
						'',
					categoryIcon: '',
				};
			}) ?? [];
		const extendedProfile: ExtendedProfile = {
			...(profile ?? {}),
			sets: sets,
			achievementCategories: achievementCategories,
		};
		return extendedProfile;
	}
}
