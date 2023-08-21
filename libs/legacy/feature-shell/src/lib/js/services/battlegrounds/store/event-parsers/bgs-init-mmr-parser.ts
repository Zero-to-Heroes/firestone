import { EventEmitter } from '@angular/core';
import { ALL_BG_RACES } from '@firestone-hs/reference-data';
import { Preferences } from '@legacy-import/src/lib/js/models/preferences';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameStateService } from '../../../decktracker/game-state.service';
import { MemoryInspectionService } from '../../../plugins/memory-inspection.service';
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
		console.log('[bgs-mmr] mmrAtStart', reviewId, mmr, event);

		const prefs = await this.prefs.getPreferences();

		// Save the previous prefs so we can set them back to their original values once the game ends
		const savedPrefs = {
			...prefs,
			bgsSavedRankFilter: prefs.bgsActiveRankFilter,
			bgsSavedTribesFilter: prefs.bgsActiveTribesFilter,
			bgsSavedAnomaliesFilter: prefs.bgsActiveAnomaliesFilter,
		};
		await this.prefs.savePreferences(savedPrefs);

		const races = !!currentState.currentGame.availableRaces?.length
			? currentState.currentGame.availableRaces
			: ALL_BG_RACES;

		const anomalies = !!currentState.currentGame.anomalies?.length ? currentState.currentGame.anomalies : [];

		const percentile = prefs.bgsUseMmrFilterInHeroSelection
			? [...(event.mmrPercentiles ?? [])]
					.sort((a, b) => b.mmr - a.mmr)
					.find((percentile) => percentile.mmr <= (mmr ?? 0))
			: null;

		const newPrefs: Preferences = {
			...savedPrefs,
			bgsActiveTribesFilter: races,
			bgsActiveAnomaliesFilter: anomalies,
			bgsActiveRankFilter: percentile?.percentile ?? 100,
		};
		await this.prefs.savePreferences(newPrefs);

		return currentState.update({
			currentGame: currentState.currentGame.update({
				mmrAtStart: mmr,
			} as BgsGame),
		} as BattlegroundsState);
	}
}
