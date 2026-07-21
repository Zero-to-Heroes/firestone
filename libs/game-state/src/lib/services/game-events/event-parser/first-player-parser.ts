import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';

export class FirstPlayerParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, , localPlayer, entityId] = gameEvent.parse();
		const isPlayer = entityId === localPlayer.Id;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const newDeck = deck.update({
			isFirstPlayer: true,
		});

		let opponentDeck = isPlayer ? currentState.opponentDeck : currentState.playerDeck;
		// if we have Aya, Lotus Kingpin in our starting deck, but we end up going first, that means the opponent must have it in their deck as well
		if (isPlayer && newDeck.deckList.some((c) => c.cardId === CardIds.AyaLotusKingpin_JAIL_504)) {
			opponentDeck = opponentDeck.update({
				additionalKnownCardsInDeck: [
					...opponentDeck.additionalKnownCardsInDeck,
					CardIds.AyaLotusKingpin_JAIL_504,
				],
			});
		}

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
			[isPlayer ? 'opponentDeck' : 'playerDeck']: opponentDeck,
		});
	}

	event(): string {
		return GameEvent.FIRST_PLAYER;
	}
}
