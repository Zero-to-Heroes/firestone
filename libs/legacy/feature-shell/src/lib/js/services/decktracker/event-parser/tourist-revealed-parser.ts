import { CardClass } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class TouristRevealedParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const refCard = this.allCards.getCard(cardId);
		const card = DeckCard.create({
			entityId: null,
			cardId: cardId,
			cardName: this.i18n.translateString('decktracker.tourist', {
				className: this.i18n.translateString(
					`global.class.${CardClass[gameEvent.additionalData.touristFor].toLowerCase()}`,
				),
			}),
			refManaCost: refCard?.cost,
			rarity: refCard?.rarity?.toLowerCase(),
			zone: null,
		} as DeckCard);

		const newGlobalEffects = this.helper.addSingleCardToZone(deck.globalEffects, card);
		const alreadyRevealedTourist = deck.getAllCardsInDeck().find((c) => c.cardId === cardId);

		let newDeck = deck.deck;
		let newHero = deck.hero;
		if (!alreadyRevealedTourist) {
			const cardInDeck = DeckCard.create({
				entityId: null,
				cardId: cardId,
				cardName: refCard.name,
				refManaCost: refCard?.cost,
				rarity: refCard?.rarity?.toLowerCase(),
				zone: null,
			} as DeckCard);
			newDeck = this.helper.addSingleCardToZone(newDeck, cardInDeck);

			const heroInitialClasses = newHero.initialClasses ?? newHero.classes ?? [];
			const touristClass: CardClass = CardClass[gameEvent.additionalData.touristFor as string];
			const initialClassesWithTourist = [...heroInitialClasses, touristClass];
			newHero = newHero.update({
				initialClasses: initialClassesWithTourist,
			});
		}

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			deck: newDeck,
			globalEffects: newGlobalEffects,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.TOURIST_REVEALED;
	}
}
