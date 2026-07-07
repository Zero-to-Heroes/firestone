import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { globalEffectTriggers, globalEffectTriggersEffects } from '../../hs-utils';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { modifyDeckForSpecialCardEffects } from './deck-contents-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class GlobalMinionEffectParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && globalEffectTriggersEffects.includes(gameEvent.additionalData?.prefabId);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [inputCardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		let cardId = inputCardId;
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		let effectTrigger = globalEffectTriggers.find((e) => e.cardId === cardId);
		// console.debug('cardId', cardId, effectTrigger, gameEvent);
		if (effectTrigger?.cardId !== cardId || effectTrigger.forceUseParentInfo) {
			cardId = gameEvent.additionalData?.parentCardId;
			effectTrigger = globalEffectTriggers.find((e) => e.cardId === cardId);
			// console.debug('parent cardId', cardId, effectTrigger);
			if (effectTrigger?.cardId !== cardId) {
				console.warn(
					'trying to apply global effect trigger to wrong card',
					cardId,
					inputCardId,
					effectTrigger,
					gameEvent.additionalData?.prefabId,
				);
				return currentState;
			}
		}
		// console.debug('effectTrigger', effectTrigger, cardId, globalEffectTriggers, gameEvent);

		const refCard = this.allCards.getCard(cardId);
		const card = DeckCard.create({
			entityId: undefined,
			cardId: cardId,
			cardName: refCard.name,
			refManaCost: refCard?.cost,
			rarity: refCard?.rarity?.toLowerCase(),
			zone: undefined,
		});
		const newGlobalEffects = this.helper.addSingleCardToZone(deck.globalEffects, card);
		// console.debug('newGlobalEffects', newGlobalEffects, cardId, card, deck.globalEffects);
		const deckAfterSpecialCaseUpdate: DeckState = modifyDeckForSpecialCardEffects(
			cardId,
			deck,
			this.allCards,
			this.i18n,
		);
		let newDeckContents = deck.deck;
		// See start-of-game-effect-parser
		// Azalina Soulsever for instance works as a Start of Game effect, but isn't flagged as such
		if (
			!deck.deckList?.length &&
			!deck.deckstring &&
			// If the card we try to add has already been played, it's not in the deck
			!deck.findCard(entityId, { includeTrueEntityId: true })?.card
		) {
			const fillerCard = deck.deck.find(
				(card) => !card.entityId && !card.cardId && !card.cardName && !card.creatorCardId,
			);
			newDeckContents = newDeckContents.filter((e) => e !== fillerCard);
			newDeckContents = this.helper.addSingleCardToZone(newDeckContents, card);
			// newDeckContents = this.helper.empiricReplaceCardInZone(deck.deck, card, true);
		}
		const newPlayerDeck: DeckState = deckAfterSpecialCaseUpdate.update({
			deck: newDeckContents,
			globalEffects: newGlobalEffects,
		} as DeckState);
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		} as any);
	}

	event(): string {
		return 'GlobalMinionEffectParser';
	}
}
