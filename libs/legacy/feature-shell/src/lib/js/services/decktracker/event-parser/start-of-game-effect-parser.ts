import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { globalEffectCards } from '../../hs-utils';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { modifyDeckForSpecialCardEffects } from './deck-contents-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class StartOfGameEffectParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const refCard = this.allCards.getCard(cardId);
		const card = DeckCard.create({
			entityId: null,
			cardId: cardId,
			cardName: refCard.name,
			refManaCost: refCard?.cost,
			rarity: refCard?.rarity?.toLowerCase(),
			zone: null,
		} as DeckCard);
		const newGlobalEffects = globalEffectCards.includes(gameEvent.cardId as CardIds)
			? this.helper.addSingleCardToZone(deck.globalEffects, card)
			: deck.globalEffects;
		let newDeckContents = deck.deck;
		if (!deck.getAllCardsInDeckWithoutOptions().some((card) => card.cardId === cardId)) {
			newDeckContents = this.helper.addSingleCardToZone(deck.deck, card);
		}
		const deckAfterSpecialCaseUpdate: DeckState = modifyDeckForSpecialCardEffects(
			cardId,
			deck,
			this.allCards,
			this.i18n,
		);
		const newPlayerDeck: DeckState = deckAfterSpecialCaseUpdate.update({
			globalEffects: newGlobalEffects,
			deck: newDeckContents,
		} as DeckState);
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		} as any);
	}

	event(): string {
		return 'StartOfGameEffectParser';
	}
}
