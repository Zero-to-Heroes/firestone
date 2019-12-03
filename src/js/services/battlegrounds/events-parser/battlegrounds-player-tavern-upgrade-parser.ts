import { BattlegroundsPlayer } from '../../../models/battlegrounds/battlegrounds-player';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class BattlegroundsPlayerTavernUpgradeParser implements EventParser {
	public applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.BATTLEGROUNDS_TAVERN_UPGRADE;
	}

	public async parse(currentState: BattlegroundsState, gameEvent: GameEvent): Promise<BattlegroundsState> {
		const cardId = gameEvent.additionalData.cardId;
		const newTavernTier = gameEvent.additionalData.tavernLevel;
		const player: BattlegroundsPlayer = currentState.getPlayer(cardId);
		const newPlayer = player.update({ tavernTier: newTavernTier } as BattlegroundsPlayer);
		return currentState.updatePlayer(newPlayer);
	}

	public event() {
		return GameEvent.BATTLEGROUNDS_TAVERN_UPGRADE;
	}
}
