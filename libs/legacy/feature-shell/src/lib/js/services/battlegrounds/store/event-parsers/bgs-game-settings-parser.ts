import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsGameSettingsEvent } from '../events/bgs-game-settings-event';
import { EventParser } from './_event-parser';

export class BgsGameSettingsParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'BgsGameSettingsEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsGameSettingsEvent): Promise<BattlegroundsState> {
		return currentState.update({
			currentGame: currentState.currentGame?.update({
				hasPrizes: event.event.additionalData.battlegroundsPrizes,
				hasQuests: event.event.additionalData.battlegroundsQuests,
				hasBuddies: event.event.additionalData.battlegroundsBuddies,
				anomalies:
					event.event.additionalData.battlegroundsAnomalies?.map(
						(dbfId) => this.allCards.getCard(dbfId)?.id,
					) ?? ([] as readonly string[]),
			} as BgsGame),
		} as BattlegroundsState);
	}
}
