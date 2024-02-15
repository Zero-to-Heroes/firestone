import { BattlegroundsState, BgsPlayer, BgsTriple } from '@firestone/battlegrounds/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsTripleCreatedEvent } from '../events/bgs-triple-created-event';
import { EventParser } from './_event-parser';

export class BgsTripleCreatedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsTripleCreatedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsTripleCreatedEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.findPlayer(event.playerId);
		if (!playerToUpdate) {
			console.warn(
				'Could not find player to update for triple history',
				currentState.currentGame.reviewId,
				event.heroCardId,
				normalizeHeroCardId(event.heroCardId, this.allCards),
				currentState.currentGame.players.map((player) => player.cardId),
				currentState.currentGame.players.map((player) => normalizeHeroCardId(player.cardId, this.allCards)),
			);
			return currentState;
		}
		const newHistory: readonly BgsTriple[] = [
			...playerToUpdate.tripleHistory,
			BgsTriple.create({
				tierOfTripledMinion: playerToUpdate.getCurrentTavernTier(),
				turn: currentState.currentGame.currentTurn,
			}),
		];
		const newPlayer = playerToUpdate.update({
			tripleHistory: newHistory,
		} as BgsPlayer);
		const newGame = currentState.currentGame.updatePlayer(newPlayer);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
