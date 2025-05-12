import { normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BattlegroundsState, BgsPlayer } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsTrinketSelectedEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsTrinketSelectedEvent' as const;
	constructor(
		public readonly heroCardId: string,
		public readonly playerId: number,
		public readonly trinketDbfId: number,
		public readonly isFirstTrinket: boolean,
	) {
		super('BgsTrinketSelectedEvent');
	}
}

export class BgsTrinketSelectedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsTrinketSelectedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsTrinketSelectedEvent): Promise<BattlegroundsState> {
		console.debug('[bgs-trinket-selected] updating trinkets', event);
		const playerToUpdate = currentState.currentGame.findPlayer(event.playerId);
		if (!playerToUpdate) {
			console.warn(
				'Could not find player to update for trinkets',
				currentState.currentGame.reviewId,
				event.heroCardId,
				event.playerId,
				normalizeHeroCardId(event.heroCardId, this.allCards),
				currentState.currentGame.players.map((player) => player.cardId),
				currentState.currentGame.players.map((player) => normalizeHeroCardId(player.cardId, this.allCards)),
			);
			return currentState;
		}

		const lesserTrinket = event.isFirstTrinket
			? this.allCards.getCard(event.trinketDbfId).id
			: playerToUpdate.lesserTrinket;
		const greaterTrinket = event.isFirstTrinket
			? playerToUpdate.greaterTrinket
			: this.allCards.getCard(event.trinketDbfId).id;

		const newPlayer = playerToUpdate.update({
			lesserTrinket: lesserTrinket,
			greaterTrinket: greaterTrinket,
		} as BgsPlayer);
		const newGame = currentState.currentGame.updatePlayer(newPlayer);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
