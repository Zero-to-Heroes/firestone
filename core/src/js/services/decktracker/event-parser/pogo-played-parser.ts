import { CardIds, GameType } from '@firestone-hs/reference-data';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class PogoPlayedParser implements EventParser {
	private static POGO_CARD_IDS = [
		CardIds.Collectible.Rogue.PogoHopper,
		CardIds.NonCollectible.Rogue.PogoHopper,
		CardIds.NonCollectible.Rogue.PogoHopperTavernBrawl,
	];

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return (
			state &&
			gameEvent.type === GameEvent.CARD_PLAYED &&
			PogoPlayedParser.POGO_CARD_IDS.includes(gameEvent.cardId)
		);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		// console.log('preparing to handle pogo played');

		const isPlayer = controllerId === localPlayer.PlayerId;
		// console.log(
		// 	'is player',
		// 	isPlayer,
		// 	currentState.metadata.gameType !== GameType.GT_BATTLEGROUNDS &&
		// 		currentState.metadata.gameType !== GameType.GT_BATTLEGROUNDS_FRIENDLY,
		// );
		if (
			!isPlayer &&
			// Don't show the opponent's pogo counter in battlegrounds
			currentState.metadata.gameType !== GameType.GT_BATTLEGROUNDS &&
			currentState.metadata.gameType !== GameType.GT_BATTLEGROUNDS_FRIENDLY
		) {
			return currentState;
		}
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			pogoHopperSize: (deck.pogoHopperSize || 0) + 1,
		} as DeckState);
		// console.log('newplayerdeck', newPlayerDeck);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'POGO_PLAYED';
	}
}
