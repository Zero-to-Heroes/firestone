import { BgsPlayer } from '@firestone-hs/hs-replay-xml-parser';
import { CardIds, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BgsGame } from '@legacy-import/src/lib/js/models/battlegrounds/bgs-game';
import { BgsBuddyGainedEvent } from '@services/battlegrounds/store/events/bgs-buddy-gained-event';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { GameEvents } from '../../../game-events.service';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsBuddyGainedParser implements EventParser {
	constructor(private readonly gameEventsService: GameEvents, private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsBuddyGainedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsBuddyGainedEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.players.find(
			(player) =>
				normalizeHeroCardId(player.cardId, this.allCards.getService()) ===
				normalizeHeroCardId(event.heroCardId, this.allCards.getService()),
		);
		if (!playerToUpdate) {
			if (event.heroCardId !== CardIds.KelthuzadBattlegrounds) {
				if (!currentState.reconnectOngoing && !this.gameEventsService.isCatchingUpLogLines()) {
					console.error(
						'No player found to update the buddy',
						currentState.currentGame.reviewId,
						event.heroCardId,
						normalizeHeroCardId(event.heroCardId, this.allCards.getService()),
						currentState.currentGame.players.map((player) => player.cardId),
					);
				}
			}
			return currentState;
		}
		// Can happen with Aranna getting their new HP - it sends a new Buddy Gained event
		if (event.totalBuddies === playerToUpdate.buddyTurns.length) {
			return currentState;
		}

		const turn = currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay();
		const newPlayer = playerToUpdate.update({
			buddyTurns: [...playerToUpdate.buddyTurns, turn],
		});
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
