import { CardIds } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { GameEvent } from '../../../../models/game-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsCardPlayedEvent } from '../events/bgs-card-played-event';
import { EventParser } from './_event-parser';

export class BgsCardPlayedParser implements EventParser {
	private static POGO_CARD_IDS = [
		CardIds.PogoHopper_BOT_283,
		CardIds.PogoHopper_BGS_028,
		CardIds.PogoHopper_TB_BaconUps_077,
	];

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsCardPlayedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsCardPlayedEvent): Promise<BattlegroundsState> {
		const gameEvent: GameEvent = event.gameEvent;
		const [cardId, controllerId, localPlayer] = gameEvent.parse();

		if (!BgsCardPlayedParser.POGO_CARD_IDS.includes(cardId as CardIds)) {
			return currentState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		if (!isPlayer) {
			return currentState;
		}

		const newPogoCount = (currentState.currentGame.pogoHoppersCount || 0) + 1;
		return currentState.update({
			currentGame: currentState.currentGame.update({
				pogoHoppersCount: newPogoCount,
			} as BgsGame),
		} as BattlegroundsState);
	}
}
