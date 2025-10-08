import { isBattlegrounds } from '@firestone-hs/reference-data';
import { PreferencesService } from '@firestone/shared/common/service';
import { ILocalizationService, OwUtilsService } from '@firestone/shared/framework/core';
import { GameState } from '../../../../models/game-state';
import { GameEvent } from '../../game-event';
import { EventParser } from '../_event-parser';

export class BgsRecruitPhaseParser implements EventParser {
	constructor(
		private readonly owUtils: OwUtilsService,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const prefs = await this.prefs.getPreferences();
		if (prefs.flashWindowOnYourTurn) {
			this.owUtils.flashWindow();
		}
		if (prefs.showNotificationOnYourTurn) {
			this.owUtils.showWindowsNotification(
				this.i18n.translateString('app.decktracker.notifications.turn-start-title'),
				'',
			);
		}
		const newGame = currentState.bgState.currentGame!.update({
			phase: 'recruit',
		});
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
				duoPendingBoards: [],
				playerTeams: undefined,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_RECRUIT_PHASE;
	}
}
