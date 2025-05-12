import { BattlegroundsState, BgsPlayer } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsDamageDealtEvent } from '../events/bgs-damage-dealth-event';
import { EventParser } from './_event-parser';

export class BgsDamageDealtParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsDamageDealtEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsDamageDealtEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.findPlayer(event.playerId);
		if (!playerToUpdate) {
			console.warn(
				'[bgs-damage] Could not find player to update for damage dealt',
				event.playerId,
				event,
				currentState,
			);
			return currentState;
		}
		const newPlayer = playerToUpdate.update({
			damageTaken: event.damage,
		} as BgsPlayer);
		const newGame = currentState.currentGame.updatePlayer(newPlayer);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
