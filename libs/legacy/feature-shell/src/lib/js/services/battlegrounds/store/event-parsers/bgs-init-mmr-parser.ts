import { EventEmitter } from '@angular/core';
import { ALL_BG_RACES } from '@firestone-hs/reference-data';
import { BG_USE_ANOMALIES, BattlegroundsState, BgsGame } from '@firestone/battlegrounds/common';
import { GameState } from '@firestone/game-state';
import { MemoryInspectionService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { GameStateService } from '../../../decktracker/game-state.service';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsInitMmrEvent } from '../events/bgs-init-mmr-event';
import { EventParser } from './_event-parser';

export class BgsInitMmrParser implements EventParser {
	constructor(
		private readonly memoryService: MemoryInspectionService,
		private readonly gameState: GameStateService,
		private readonly prefs: PreferencesService,
		private readonly stateUpdaterProvider: () => EventEmitter<MainWindowStoreEvent>,
	) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsInitMmrEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsInitMmrEvent,
		gameState?: GameState,
	): Promise<BattlegroundsState> {
		const bgsInfo = await this.memoryService.getBattlegroundsInfo();
		const reviewId = await this.gameState.getCurrentReviewId();
		const mmr = bgsInfo?.Rating;
		console.log('[bgs-mmr] mmrAtStart', reviewId, mmr);

		const prefs = await this.prefs.getPreferences();

		// Save the previous prefs so we can set them back to their original values once the game ends
		const savedPrefs: Preferences = {
			...prefs,
			bgsSavedRankFilter: prefs.bgsActiveRankFilter,
			bgsSavedTribesFilter: prefs.bgsActiveTribesFilter,
			bgsSavedAnomaliesFilter: [], //prefs.bgsActiveAnomaliesFilter,
		};
		await this.prefs.savePreferences(savedPrefs);

		const races = !!currentState.currentGame.availableRaces?.length
			? currentState.currentGame.availableRaces
			: ALL_BG_RACES;

		const anomalies = !!currentState.currentGame.anomalies?.length ? currentState.currentGame.anomalies : [];

		const percentile = prefs.bgsActiveUseMmrFilterInHeroSelection
			? [...(event.mmrPercentiles ?? [])]
					.sort((a, b) => b.mmr - a.mmr)
					.find((percentile) => percentile.mmr <= (mmr ?? 0))
			: null;

		const newPrefs: Preferences = {
			...savedPrefs,
			bgsActiveTribesFilter: races,
			bgsActiveAnomaliesFilter: BG_USE_ANOMALIES ? anomalies.filter((a) => !!a) : [],
			bgsActiveRankFilter: percentile?.percentile ?? 100,
			bgsActiveUseMmrFilterInHeroSelection: savedPrefs.bgsSavedUseMmrFilterInHeroSelection,
			bgsActiveUseAnomalyFilterInHeroSelection: savedPrefs.bgsSavedUseAnomalyFilterInHeroSelection,
		};
		await this.prefs.savePreferences(newPrefs);

		return currentState.update({
			currentGame: currentState.currentGame.update({
				mmrAtStart: mmr,
			} as BgsGame),
		} as BattlegroundsState);
	}
}
