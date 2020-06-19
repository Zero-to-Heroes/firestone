import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsTavernUpgrade } from '../../../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BgsTavernUpgradeEvent } from '../events/bgs-tavern-upgrade-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsTavernUpgradeParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsTavernUpgradeEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsTavernUpgradeEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.players.find(
			player => normalizeHeroCardId(player.cardId) === normalizeHeroCardId(event.heroCardId),
		);
		const newHistory: readonly BgsTavernUpgrade[] = [
			...playerToUpdate.tavernUpgradeHistory,
			BgsTavernUpgrade.create({
				tavernTier: event.tavernTier,
				turn: currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay(),
			}),
		];
		const newPlayer = playerToUpdate.update({
			tavernUpgradeHistory: newHistory,
		} as BgsPlayer);
		const newPlayers: readonly BgsPlayer[] = currentState.currentGame.players.map(player =>
			normalizeHeroCardId(player.cardId) === normalizeHeroCardId(newPlayer.cardId) ? newPlayer : player,
		);
		const newGame = currentState.currentGame.update({ players: newPlayers } as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
