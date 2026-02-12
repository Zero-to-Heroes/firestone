import { CardIds, isCoin } from '@firestone-hs/reference-data';
import { sleep } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { DeckHandlerService } from '../../deck-handler.service';
import { DeckParserService } from '../../deck/deck-parser.service';
import { DeckstringOverrideEvent } from '../../game-state-events/deckstring-override-event';
import { GameEvent } from '../game-event';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { EventParser } from './_event-parser';
import { DeckstringOverrideParser } from './deckstring-override-parser';

export class PlayerDeckInfoParser implements EventParser {
	constructor(
		private readonly deckParser: DeckParserService,
		private readonly handler: DeckHandlerService,
		private readonly allCards: CardsFacadeService,
		private readonly gameEventsEmitter: GameEventsEmitterService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// Need to wait until we have the cards in hand
		if (!currentState.playerDeck.hand.length) {
			await sleep(300);
			console.debug('[player-deck-info-parser] no cards in hand, waiting');
			this.gameEventsEmitter.allEvents.next(gameEvent);
			return currentState;
		}

		const currentDeck = currentState.playerDeck.deckList;
		console.debug('[player-deck-info-parser] currentDeck', currentDeck);
		// Whizbang
		if (currentDeck?.length === 1 && currentDeck[0].cardId === CardIds.SplendiferousWhizbang_TOY_700) {
			console.log('[player-deck-info-parser] whizbang deck, trying to guess the exact deck');
			const cardsInHand = currentState.playerDeck.hand
				.map((c) => c.cardId)
				.filter((c) => !isCoin(c, this.allCards));
			console.log('[player-deck-info-parser] cards in hand', cardsInHand);
			const handDbfIds = cardsInHand.map((c) => this.allCards.getCard(c)?.dbfId);
			console.debug('[player-deck-info-parser] card dbf ids', handDbfIds);
			const deckTemplates = await this.deckParser.getDeckTemplates();
			const whizbangDecks = deckTemplates.filter((d) => d.IsWhizbang);
			console.debug('[player-deck-info-parser] whizbangDecks', whizbangDecks);
			for (const whizbangDeck of whizbangDecks) {
				console.debug(
					'[player-deck-info-parser] whizbangDeck',
					whizbangDeck,
					whizbangDeck.DeckList.filter((dbfId) => handDbfIds.includes(+dbfId)),
					handDbfIds.filter((dbfId) => !whizbangDeck.DeckList.includes(+dbfId)),
				);
				if (handDbfIds.length && handDbfIds.every((dbfId) => whizbangDeck.DeckList.includes(+dbfId))) {
					console.log(
						'[player-deck-info-parser] found whizbang deck',
						whizbangDeck.Name,
						whizbangDeck,
						handDbfIds.filter((dbfId) => !whizbangDeck.DeckList.includes(+dbfId)),
					);
					const whizbangDeckInfo = await this.deckParser.getTemplateDeck(
						whizbangDeck.DeckId!,
						currentState.metadata.scenarioId,
						currentState.metadata.gameType,
						currentState.metadata.formatType,
					);
					console.debug('[player-deck-info-parser] force using whizbang deck', whizbangDeckInfo);
					if (!!whizbangDeckInfo) {
						const newCurrentState = await new DeckstringOverrideParser(this.handler).parse(
							currentState,
							new DeckstringOverrideEvent(whizbangDeckInfo?.name, whizbangDeckInfo.deckstring!, 'player'),
						);
						return newCurrentState;
					}
				}
			}
		}

		return currentState;
	}

	event(): string {
		return GameEvent.PLAYER_DECK_INFO;
	}
}
