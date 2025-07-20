import { Injectable } from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { capitalizeFirstLetter } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject, sampleTime, tap } from 'rxjs';
import {
	ArenaClassFilterType,
	ArenaTimeFilterType,
	BgsHeroSortFilterType,
	CurrentAppType,
	DeckFilters,
	Ftue,
	MercenariesHeroLevelFilterType,
	MercenariesModeFilterType,
	MercenariesPersonalHeroesSortCriteria,
	MercenariesPveDifficultyFilterType,
	MercenariesPvpMmrFilterType,
	MercenariesRoleFilterType,
	MercenariesStarterFilterType,
	ReplaysFilterCategoryType,
	StatsXpGraphSeasonFilterType,
} from '../models/pref-model';
import { Preferences } from '../models/preferences';
import { OutOfCardsToken } from '../models/unfit-pref-model';
import { PreferencesStorageService } from './preferences-storage.service';

export type PrefsSelector<P extends Preferences, T> = (prefs: P) => T;

@Injectable()
export class PreferencesService extends AbstractFacadeService<PreferencesService> {
	public static readonly DECKTRACKER_OVERLAY_DISPLAY = 'DECKTRACKER_OVERLAY_DISPLAY';
	public static readonly DECKTRACKER_MATCH_OVERLAY_DISPLAY = 'DECKTRACKER_MATCH_OVERLAY_DISPLAY';
	public static readonly DECKTRACKER_OVERLAY_SIZE = 'DECKTRACKER_OVERLAY_SIZE';
	public static readonly TWITCH_CONNECTION_STATUS = 'TWITCH_CONNECTION_STATUS';

	public preferences$$: BehaviorSubject<Preferences>;

	private storage: PreferencesStorageService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'preferencesService', () => !!this.preferences$$);
	}

	protected override assignSubjects() {
		this.preferences$$ = this.mainInstance.preferences$$;
	}

	protected async init() {
		this.storage = AppInjector.get(PreferencesStorageService);
		this.preferences$$ = new BehaviorSubject<Preferences>(new Preferences());

		console.log('[preferences] ready');

		this.preferences$$
			.pipe(
				tap((prefs) => console.debug('[preferences] prefs updated', prefs)),
				sampleTime(1500),
			)
			.subscribe((prefs) => this.storage.saveUserPreferences(prefs));
		window['prefsObservers'] = () => {
			console.log(this.preferences$$.observers);
		};
		this.preferences$$.next(this.storage.getUserPreferences());
	}

	public async getPreferences(): Promise<Preferences> {
		await this.isReady();
		return this.preferences$$.getValue();
		// this.storage.getUserPreferences();
	}

	public async updatePrefs<K extends keyof Preferences>(key: K, value: Preferences[K]) {
		console.debug('[preferences] updating prefs', key, value);
		const prefs = this.preferences$$.getValue();
		const newPrefs = {
			...prefs,
			[key]: value,
		};
		this.preferences$$.next(newPrefs);
	}

	public async savePreferences(userPrefs: Preferences, eventName: string | null = null) {
		// console.debug('saving prefs', new Error().stack);
		const finalPrefs = {
			...userPrefs,
			lastUpdateDate: new Date(),
		};
		// await this.storage.saveUserPreferences(finalPrefs);

		this.preferences$$.next(finalPrefs);
		return finalPrefs;
	}

	public async reset() {
		const currentPrefs = await this.getPreferences();
		const newPrefs: Preferences = Object.assign(new Preferences(), {
			desktopDeckHiddenDeckCodes: currentPrefs.desktopDeckHiddenDeckCodes,
			desktopDeckStatsReset: currentPrefs.desktopDeckStatsReset,
		} as Preferences);
		await this.savePreferences(newPrefs);
	}

	public async resetDecktrackerPositions() {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs };
		for (const key of Object.keys(newPrefs)) {
			const value = newPrefs[key];
			if (value?.left != null || value?.top != null) {
				newPrefs[key] = undefined;
			}
		}
		await this.savePreferences(newPrefs);
	}

	public async resetRegionFilter() {
		const prefs = await this.getPreferences();
		if (prefs.regionFilter === 'all') {
			return;
		}

		const newPrefs: Preferences = { ...prefs, regionFilter: 'all' };
		await this.savePreferences(newPrefs);
	}

	public async setValue(field: string, pref: boolean | number | string): Promise<Preferences> {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, [field]: pref };
		await this.savePreferences(newPrefs);
		return newPrefs;
	}

	public async setGlobalFtueDone() {
		const prefs = await this.getPreferences();
		const ftue: Ftue = { ...prefs.ftue, hasSeenGlobalFtue: true };
		const newPrefs: Preferences = { ...prefs, ftue: ftue };
		await this.savePreferences(newPrefs);
	}

	public async updateReplayFilterDeckstring(type: ReplaysFilterCategoryType, value: string) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, replaysFilterDeckstring: value };
		await this.savePreferences(newPrefs);
	}

	public async updateReplayFilterGameMode(type: ReplaysFilterCategoryType, value: string) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, replaysFilterGameMode: value };
		await this.savePreferences(newPrefs);
	}

	public async updateReplayFilterBgHero(type: ReplaysFilterCategoryType, value: string) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, replaysFilterBgHero: value };
		await this.savePreferences(newPrefs);
	}

	public async updateReplayFilterPlayerClass(type: ReplaysFilterCategoryType, value: string) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, replaysFilterPlayerClass: value };
		await this.savePreferences(newPrefs);
	}

	public async updateReplayFilterOpponentClass(type: ReplaysFilterCategoryType, value: string) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, replaysFilterOpponentClass: value };
		await this.savePreferences(newPrefs);
	}

	public async setDontShowNewVersionNotif(value: boolean) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, dontShowNewVersionNotif: value };
		await this.savePreferences(newPrefs);
	}

	public async setMainVisibleSection(value: CurrentAppType) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, currentMainVisibleSection: value };
		await this.savePreferences(newPrefs);
	}

	public async setContactEmail(value: string) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, contactEmail: value };
		await this.savePreferences(newPrefs);
	}

	public async toggleAdvancedSettings() {
		const prefs = await this.getPreferences();
		const advancedModeToggledOn = prefs.advancedModeToggledOn;
		const newPrefs: Preferences = { ...prefs, advancedModeToggledOn: !advancedModeToggledOn };
		await this.savePreferences(newPrefs);
	}

	public async setHasSeenVideoCaptureChangeNotif(pref: boolean) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, hasSeenVideoCaptureChangeNotif: pref };
		await this.savePreferences(newPrefs);
	}

	public async setTwitchAccessToken(pref: string) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, twitchAccessToken: pref };
		await this.savePreferences(newPrefs, PreferencesService.TWITCH_CONNECTION_STATUS);
	}

	public async setTwitchUserName(userName: string, loginName: string) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, twitchUserName: userName, twitchLoginName: loginName };
		await this.savePreferences(newPrefs, PreferencesService.TWITCH_CONNECTION_STATUS);
	}

	public async disconnectTwitch() {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, twitchAccessToken: undefined, twitchLoginName: undefined };
		await this.savePreferences(newPrefs, PreferencesService.TWITCH_CONNECTION_STATUS);
	}

	public async udpateOutOfCardsToken(token: OutOfCardsToken | null) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, outOfCardsToken: token };
		await this.savePreferences(newPrefs);
	}

	public async acknowledgeFtue(pref: string) {
		const prefs = await this.getPreferences();
		const ftue = prefs.ftue;
		const newFtue = { ...ftue, [pref]: true } as Ftue;
		const newPrefs: Preferences = { ...prefs, ftue: newFtue };
		await this.savePreferences(newPrefs);
	}

	public async acknowledgeReleaseNotes(version: string) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, lastSeenReleaseNotes: version };
		await this.savePreferences(newPrefs);
	}

	public async updateWidgetPosition(prefName: keyof Preferences, left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, [prefName]: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateCurrentSessionWidgetPosition(left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, currentSessionWidgetPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateLotteryPosition(left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, lotteryPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateHsQuestsWidgetPosition(left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, hsQuestsWidgetPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateBgsQuestsWidgetPosition(left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, bgsQuestsWidgetPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateMercsQuestsWidgetPosition(left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, mercsQuestsWidgetPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateTurnTimerWidgetPosition(left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, turnTimerWidgetPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateConstructedMulliganDeckWidgetPosition(left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, constructedMulliganDeckWidgetPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateTrackerPosition(left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, decktrackerPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateOpponentTrackerPosition(left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, opponentOverlayPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateSecretsHelperPosition(left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, secretsHelperPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateBgsSimulationWidgetPosition(left: any, top: any) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, bgsSimulationWidgetPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateBgsBannedTribedPosition(left: any, top: any) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, bgsBannedTribesWidgetPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateBgsHeroTipsPosition(left: any, top: any) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, bgsHeroTipsWidgetPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateBgsMinionsListPosition(left: any, top: any) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, bgsMinionsListPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateCounterPosition(activeCounter: string, side: string, left: any, top: any) {
		const prefs = await this.getPreferences();
		const propertyName = this.buildCounterPropertyName(activeCounter, side);
		const newPrefs: Preferences = { ...prefs, [propertyName]: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async getCounterPosition(activeCounter: string, side: string) {
		const prefs = await this.getPreferences();
		return prefs[this.buildCounterPropertyName(activeCounter, side)];
	}

	public async updateSecretsHelperWidgetPosition(left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, secretsHelperWidgetPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateBgsOverlayButtonPosition(left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, bgsOverlayButtonPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateBgsNumberOfDisplayedTabs(tabsNumber: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, bgsNumberOfDisplayedTabs: tabsNumber };
		await this.savePreferences(newPrefs);
	}

	public async setZoneToggleDefaultClose(name: string, side: string, close: boolean) {
		const prefs = await this.getPreferences();
		const propertyName = 'overlayZoneToggleDefaultClose_' + side + '_' + name;
		const newPrefs: Preferences = { ...prefs, [propertyName]: close };
		await this.savePreferences(newPrefs);
	}

	public async getZoneToggleDefaultClose(name: string, side: string) {
		const prefs = await this.getPreferences();
		const propertyName = 'overlayZoneToggleDefaultClose_' + side + '_' + name;
		return prefs[propertyName];
	}

	public async updateBgsTribesFilter(value: readonly Race[]) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, bgsActiveTribesFilter: value };
		await this.savePreferences(newPrefs);
	}

	public async updateBgsHeroSortFilter(value: BgsHeroSortFilterType) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, bgsActiveHeroSortFilter: value };
		await this.savePreferences(newPrefs);
	}

	public async updateBgsHeroFilter(value: string) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, bgsActiveHeroFilter: value };
		await this.savePreferences(newPrefs);
	}

	public async updateBgsActiveSimulatorMinionTribeFilter(value: string) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, bgsActiveSimulatorMinionTribeFilter: value };
		await this.savePreferences(newPrefs);
	}

	public async updateBgsActiveSimulatorMinionTierFilter(value: 'all' | '1' | '2' | '3' | '4' | '5' | '6') {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, bgsActiveSimulatorMinionTierFilter: value };
		await this.savePreferences(newPrefs);
	}

	public async updateMercenariesModeFilter(value: MercenariesModeFilterType) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, mercenariesActiveModeFilter: value };
		await this.savePreferences(newPrefs);
	}

	public async updateMercenariesPveDifficultyFilter(value: MercenariesPveDifficultyFilterType) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, mercenariesActivePveDifficultyFilter: value };
		await this.savePreferences(newPrefs);
	}

	public async updateMercenariesPvpMmrFilter(value: MercenariesPvpMmrFilterType) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, mercenariesActivePvpMmrFilter: value };
		await this.savePreferences(newPrefs);
	}

	public async updateMercenariesRoleFilter(value: MercenariesRoleFilterType) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, mercenariesActiveRoleFilter: value };
		await this.savePreferences(newPrefs);
	}

	public async updateMercenariesHeroLevelFilter(value: MercenariesHeroLevelFilterType) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, mercenariesActiveHeroLevelFilter2: value };
		await this.savePreferences(newPrefs);
	}

	public async updateMercenariesStarterFilter(value: MercenariesStarterFilterType) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, mercenariesActiveStarterFilter: value };
		await this.savePreferences(newPrefs);
	}

	public async updateMercenariesTeamPlayerPosition(left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, mercenariesPlayerTeamOverlayPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateMercenariesActionsQueueOverlayPosition(left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, mercenariesActionsQueueOverlayPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateMercenariesTeamOpponentPosition(left: number, top: number) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, mercenariesOpponentTeamOverlayPosition: { left, top } };
		await this.savePreferences(newPrefs);
	}

	public async updateMercenariesPersonalHeroesSortCriteria(info: MercenariesPersonalHeroesSortCriteria) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, mercenariesPersonalHeroesSortCriterion: info };
		await this.savePreferences(newPrefs);
	}

	public async updateMercenariesShowHiddenTeams(value: boolean): Promise<Preferences> {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, mercenariesShowHiddenTeams: value };
		this.savePreferences(newPrefs);
		return newPrefs;
	}
	public async updateMercenariesHiddenTeamIds(value: string[]): Promise<Preferences> {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, mercenariesHiddenTeamIds: value };
		this.savePreferences(newPrefs);
		return newPrefs;
	}

	public async updateArenaTimeFilter(value: ArenaTimeFilterType) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, arenaActiveTimeFilter: value };
		await this.savePreferences(newPrefs);
	}

	public async updateArenaClassFilter(value: ArenaClassFilterType) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, arenaActiveClassFilter: value };
		await this.savePreferences(newPrefs);
	}

	public async updateStatsXpGraphFilter(value: StatsXpGraphSeasonFilterType) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, statsXpGraphSeasonFilter: value };
		await this.savePreferences(newPrefs);
	}

	public async setDesktopDeckFilters(value: DeckFilters) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, desktopDeckFilters: value };
		await this.savePreferences(newPrefs);
		return newPrefs;
	}

	public async updateDesktopDecktrackerChangeMatchupAsPercentages(value: boolean) {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, desktopDeckShowMatchupAsPercentages: value };
		await this.savePreferences(newPrefs);
		return newPrefs;
	}

	public async setDeckResetDates(deckstring: string, newResetDates: readonly number[]) {
		const prefs = await this.getPreferences();
		const newReset = {
			...prefs.desktopDeckStatsReset,
			[deckstring]: newResetDates,
		};
		const newPrefs: Preferences = { ...prefs, desktopDeckStatsReset: newReset };
		this.savePreferences(newPrefs);
		return newPrefs;
	}

	public async setDeckDeleteDates(deckstring: string, newDeleteDates: readonly number[]) {
		const prefs = await this.getPreferences();
		const newDelete = {
			...prefs.desktopDeckDeletes,
			[deckstring]: newDeleteDates,
		};
		const newPrefs: Preferences = { ...prefs, desktopDeckDeletes: newDelete };
		await this.savePreferences(newPrefs);
		return newPrefs;
	}

	public async setDesktopDeckHiddenDeckCodes(value: string[]): Promise<Preferences> {
		const prefs = await this.getPreferences();
		const newPrefs: Preferences = { ...prefs, desktopDeckHiddenDeckCodes: value };
		this.savePreferences(newPrefs);
		return newPrefs;
	}

	public async updateRemotePreferences() {
		// if (!this.ow) {
		// 	return;
		// }
		// const userPrefs = await this.getPreferences();
		// console.log('[preferences] prefs from DB', userPrefs != null);
		// const currentUser = await this.ow.getCurrentUser();
		// const prefsToSync = new Preferences();
		// for (const prop in userPrefs) {
		// 	const meta = Reflect.getMetadata(FORCE_LOCAL_PROP, prefsToSync, prop);
		// 	if (!meta) {
		// 		prefsToSync[prop] = userPrefs[prop];
		// 	}
		// }
		// console.log('[preferences] saving remote prefs');
		// await this.api.callPostApi(PREF_UPDATE_URL, {
		// 	userId: currentUser.userId,
		// 	userName: currentUser.username,
		// 	prefs: prefsToSync,
		// });
	}

	public async loadRemotePrefs(): Promise<Preferences | undefined> {
		return undefined;
		// if (!this.ow) {
		// 	return;
		// }
		// const currentUser = await this.ow.getCurrentUser();
		// const result: Preferences = await this.api.callPostApi(PREF_RETRIEVE_URL, {
		// 	userId: currentUser.userId,
		// 	userName: currentUser.username,
		// });
		// if (!result) {
		// 	return result;
		// }
		// const resultWithDate: Preferences = Preferences.deserialize(result);
		// this.currentSyncDate = resultWithDate.lastUpdateDate;
		// this.lastSyncPrefs = resultWithDate;
		// return resultWithDate;
	}

	private buildCounterPropertyName(activeCounter: string, side: string): string {
		return side + capitalizeFirstLetter(activeCounter) + 'CounterWidgetPosition';
	}
}
