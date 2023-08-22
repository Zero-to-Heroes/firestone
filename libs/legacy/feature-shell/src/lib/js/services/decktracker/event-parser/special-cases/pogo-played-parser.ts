import { CardIds } from '@firestone-hs/reference-data';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { EventParser } from '../event-parser';

export class PogoPlayedParser implements EventParser {
	private static POGO_CARD_IDS = [
		CardIds.PogoHopper_BOT_283,
		CardIds.PogoHopper_BGS_028,
		CardIds.PogoHopper_TB_BaconUps_077,
	];

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && PogoPlayedParser.POGO_CARD_IDS.includes(gameEvent.cardId as CardIds);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		// Don't show the opponent's pogo counter in battlegrounds
		if (!isPlayer && currentState.isBattlegrounds()) {
			return currentState;
		}
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			pogoHopperSize: (deck.pogoHopperSize || 0) + 1,
		} as DeckState);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'POGO_PLAYED';
	}
}
