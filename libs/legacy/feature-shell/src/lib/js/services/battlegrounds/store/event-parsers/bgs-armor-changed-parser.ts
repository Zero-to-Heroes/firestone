import { normalizeHeroCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsArmorChangedEvent } from '../events/bgs-armor-changed-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsArmorChangedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsArmorChangedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsArmorChangedEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.players.find(
			(player) =>
				normalizeHeroCardId(player.cardId, this.allCards) ===
				normalizeHeroCardId(event.heroCardId, this.allCards),
		);
		if (!playerToUpdate) {
			return currentState;
		}

		const newPlayer: BgsPlayer = playerToUpdate.update({
			currentArmor: event.totalArmor,
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
