import { BattlegroundsState, BgsGame } from '@firestone/battlegrounds/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsGameSettingsEvent } from '../events/bgs-game-settings-event';
import { EventParser } from './_event-parser';

export class BgsGameSettingsParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'BgsGameSettingsEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsGameSettingsEvent): Promise<BattlegroundsState> {
		console.debug('updating game settings', event.event.additionalData);
		return currentState.update({
			currentGame: currentState.currentGame?.update({
				hasPrizes: event.event.additionalData.battlegroundsPrizes,
				hasQuests: event.event.additionalData.battlegroundsQuests,
				hasBuddies: event.event.additionalData.battlegroundsBuddies,
				hasSpells: event.event.additionalData.battlegroundsSpells,
				anomalies: event.event.additionalData.battlegroundsAnomalies,
				hasTrinkets: true, // event.event.additionalData.battlegroundsTrinkets,
			} as BgsGame),
		} as BattlegroundsState);
	}
}
