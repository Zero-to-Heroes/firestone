import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsTriple } from '../../../../models/battlegrounds/in-game/bgs-triple';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BgsTripleCreatedEvent } from '../events/bgs-triple-created-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsTripleCreatedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsTripleCreatedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsTripleCreatedEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.players.find(
			(player) =>
				normalizeHeroCardId(player.cardId, this.allCards) ===
				normalizeHeroCardId(event.heroCardId, this.allCards),
		);
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
		const newPlayers: readonly BgsPlayer[] = currentState.currentGame.players.map((player) =>
			normalizeHeroCardId(player.cardId, this.allCards) === normalizeHeroCardId(newPlayer.cardId, this.allCards)
				? newPlayer
				: player,
		);
		const newGame = currentState.currentGame.update({ players: newPlayers } as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
