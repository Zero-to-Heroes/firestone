import { BattlegroundsState, BgsPlayer } from '@firestone/battlegrounds/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsArmorChangedEvent } from '../events/bgs-armor-changed-event';
import { EventParser } from './_event-parser';

export class BgsArmorChangedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsArmorChangedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsArmorChangedEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.findPlayer(event.playerId);
		if (!playerToUpdate) {
			return currentState;
		}

		const newPlayer: BgsPlayer = playerToUpdate.update({
			currentArmor: event.totalArmor,
		});

		const newGame = currentState.currentGame.updatePlayer(newPlayer);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
