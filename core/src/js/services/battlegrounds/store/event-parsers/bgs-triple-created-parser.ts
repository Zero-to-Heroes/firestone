import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsTriple } from '../../../../models/battlegrounds/in-game/bgs-triple';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BgsTripleCreatedEvent } from '../events/bgs-triple-created-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsTripleCreatedParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsTripleCreatedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsTripleCreatedEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.players.find(
			(player) => normalizeHeroCardId(player.cardId) === normalizeHeroCardId(event.heroCardId),
		);
		if (!playerToUpdate) {
			console.error(
				'Could not find player to update for triple history',
				currentState.currentGame.reviewId,
				event.heroCardId,
				currentState.currentGame.players.map((player) => player.cardId),
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
			normalizeHeroCardId(player.cardId) === normalizeHeroCardId(newPlayer.cardId) ? newPlayer : player,
		);
		const newGame = currentState.currentGame.update({ players: newPlayers } as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
