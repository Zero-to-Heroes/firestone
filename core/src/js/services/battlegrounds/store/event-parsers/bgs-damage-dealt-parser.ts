import { CardsFacadeService } from '@services/cards-facade.service';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BgsDamageDealtEvent } from '../events/bgs-damage-dealth-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsDamageDealtParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsDamageDealtEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsDamageDealtEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.players.find(
			(player) =>
				normalizeHeroCardId(player.cardId, this.allCards) ===
				normalizeHeroCardId(event.heroCardId, this.allCards),
		);
		if (!playerToUpdate) {
			return currentState;
		}
		const newPlayer = playerToUpdate.update({
			damageTaken: event.damage,
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
