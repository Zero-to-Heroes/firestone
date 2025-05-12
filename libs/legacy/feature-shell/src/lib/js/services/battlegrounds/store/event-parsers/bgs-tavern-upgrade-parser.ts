import { isBaconGhost } from '@firestone-hs/reference-data';
import { BattlegroundsState, BgsPlayer, BgsTavernUpgrade, BgsTriple } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvents } from '../../../game-events.service';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsTavernUpgradeEvent } from '../events/bgs-tavern-upgrade-event';
import { EventParser } from './_event-parser';

export class BgsTavernUpgradeParser implements EventParser {
	constructor(private readonly gameEventsService: GameEvents, private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsTavernUpgradeEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsTavernUpgradeEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.findPlayer(event.playerId);
		if (!playerToUpdate) {
			if (!isBaconGhost(event.heroCardId)) {
				if (!currentState.reconnectOngoing && !this.gameEventsService.isCatchingUpLogLines()) {
					console.warn(
						'No player found to update the history',
						currentState.currentGame.reviewId,
						event.heroCardId,
						normalizeHeroCardId(event.heroCardId, this.allCards),
						currentState.currentGame.players.map((player) => player.cardId),
					);
				}
			}
			return currentState;
		}
		const turn = currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay();
		const newHistory: readonly BgsTavernUpgrade[] = [
			...playerToUpdate.tavernUpgradeHistory,
			BgsTavernUpgrade.create({
				tavernTier: event.tavernTier,
				turn: turn,
			}),
		];
		// If the upgrade happens after a triple has been done on the same turn, it's very likely that they
		// dioscovered the triple once the upgrade occured, so we adjust the tavern tier
		const newTripleHistory: readonly BgsTriple[] = playerToUpdate.tripleHistory.map((triple) => {
			if (triple.turn === turn) {
				return {
					tierOfTripledMinion: triple.tierOfTripledMinion + 1,
					cardId: triple.cardId,
					turn: triple.turn,
				};
			} else {
				return triple;
			}
		});
		const newPlayer = playerToUpdate.update({
			tavernUpgradeHistory: newHistory,
			tripleHistory: newTripleHistory,
		} as BgsPlayer);
		const newGame = currentState.currentGame.updatePlayer(newPlayer);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
