import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { reverseIfNeeded } from '@legacy-import/src/lib/js/services/decktracker/event-parser/card-dredged-parser';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CreateCardInDeckParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = reverseIfNeeded(controllerId === localPlayer.PlayerId, gameEvent.additionalData.creatorCardId);
		// Don't add the cards created by C'Thun, as they are added via the subspell handling
		// There is the risk that, if C'Thun is enchanted and that enchantment creates a card in deck, this
		// hack will discard it. For now it's supposed to be enough of a fringe case to not matter vs
		// properly flagging the cards created by C'Thun
		if (gameEvent.additionalData.creatorCardId === CardIds.CthunTheShattered) {
			return currentState;
		}

		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		// Because we have to infer a lot of info here, we have a separate process. Not sure that it's the best
		// way though
		if (gameEvent.additionalData.creatorCardId?.startsWith(CardIds.ZilliaxDeluxe3000_TOY_330)) {
			const initialZilliax = deck.otherZone.find((c) => c.entityId === gameEvent.additionalData.creatorEntityId);
			if (!initialZilliax) {
				console.warn('[create-card-in-deck] could not find initial Zilliax');
				return currentState;
			}
			const modules =
				(initialZilliax.relatedCardIds?.length ? initialZilliax.relatedCardIds : null) ??
				deck.sideboards?.find((s) => s.keyCardId === CardIds.ZilliaxDeluxe3000_TOY_330)?.cards.map((c) => c) ??
				[];
			const cost = modules?.map((c) => this.allCards.getCard(c)?.cost).reduce((a, b) => a + b, 0);
			const updatedCard = initialZilliax.update({
				entityId: entityId,
				actualManaCost: cost,
				manaCost: cost,
				metaInfo: undefined,
				creatorCardId: gameEvent.additionalData.creatorCardId,
				zone: undefined,
				milled: false,
				relatedCardIds: modules,
			});
			const newDeck = deck.update({
				deck: this.helper.addSingleCardToZone(deck.deck, updatedCard),
			});
			// console.debug('[create-card-in-deck]', 'updating Zilliax', updatedCard, initialZilliax, newDeck);
			return currentState.update({
				[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
			});
		}

		const cardData = cardId?.length ? this.allCards.getCard(cardId) : null;
		const positionFromBottom = buildPositionFromBottom(
			deck,
			gameEvent.additionalData.creatorCardId ?? gameEvent.additionalData.influencedByCardId,
		);
		const positionFromTop = buildPositionFromTop(
			deck,
			gameEvent.additionalData.creatorCardId,
			gameEvent.additionalData.influencedByCardId,
		);
		// console.debug('[create-card-in-deck]', 'positionFromBottom', positionFromBottom, deck, gameEvent, currentState);
		const createdByJoust = gameEvent.additionalData.createdByJoust;
		const creatorEntityId =
			// In this case, the card is removed from the deck then put back, so we're actually putting back the original
			// card
			gameEvent.additionalData.influencedByCardId === CardIds.Overplanner_VAC_444
				? null
				: gameEvent.additionalData.creatorEntityId ?? gameEvent.additionalData.influencedByEntityId
				? +(gameEvent.additionalData.creatorEntityId ?? gameEvent.additionalData.influencedByEntityId)
				: null;
		const creatorEntity = creatorEntityId
			? // Because sometimes the entityId is reversed in the Other zone
			  deck.findCard(creatorEntityId)?.card ?? deck.findCard(-creatorEntityId)?.card
			: null;
		// console.debug(
		// 	'[create-card-in-deck]',
		// 	'creatorEntity',
		// 	creatorEntity,
		// 	gameEvent.additionalData.creatorEntityId,
		// 	gameEvent.additionalData.influencedByEntityId,
		// 	deck,
		// );
		// Because of Tome Tampering
		// eslint-disable-next-line prefer-const
		let { zone, card } = deck.findCard(entityId) ?? { zone: null, card: null };
		// console.debug('[create-card-in-deck]', 'card added', card, zone);
		// Sometimes a CARD_REVEALED event occurs first, so we need to
		const newCardId = cardId ?? card?.cardId;
		card = (card ?? DeckCard.create())
			.update({
				cardId: newCardId,
				// Don't store the entityId for the cards created in the opponent's deck, so that we don't know
				// what they are
				// Update: see ...
				entityId: entityId,
				cardName: this.buildCardName(cardData, gameEvent.additionalData.creatorCardId) ?? card?.cardName,
				manaCost: cardData?.cost,
				actualManaCost:
					this.buildKnownUpdatedManaCost(gameEvent.additionalData.creatorCardId) ?? cardData?.cost,
				rarity: cardData?.rarity?.toLowerCase(),
				creatorCardId:
					gameEvent.additionalData.influencedByCardId === CardIds.Overplanner_VAC_444
						? null
						: creatorEntity?.cardId ??
						  gameEvent.additionalData.creatorCardId ??
						  gameEvent.additionalData.influencedByEntityId,
				mainAttributeChange: buildAttributeChange(creatorEntity, newCardId),
				positionFromBottom: positionFromBottom,
				positionFromTop: positionFromTop,
				createdByJoust: createdByJoust,
				temporaryCard: false,
				zone: undefined,
			} as DeckCard)
			.update({
				relatedCardIds: this.buildRelatedCardIds(newCardId, deck, card?.relatedCardIds),
			});

		// console.debug('[create-card-in-deck]', 'adding card', card);

		// The initial card might be found in the other zone, so we remove it before adding it back
		const deckWithoutCard = this.helper.removeCardFromDeck(deck, entityId);
		const previousDeck = deckWithoutCard.deck;
		const newDeck: readonly DeckCard[] = this.helper.addSingleCardToZone(previousDeck, card);
		const newPlayerDeck = deckWithoutCard.update({
			deck: newDeck,
		});
		// console.debug('[create-card-in-deck]', 'newPlayerDeck', newPlayerDeck);

		if (!card.cardId && !card.entityId) {
			console.warn('Adding unidentified card in deck', card, gameEvent);
		}
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CREATE_CARD_IN_DECK;
	}

	private buildKnownUpdatedManaCost(creatorCardId: string): number {
		switch (creatorCardId) {
			case CardIds.ElixirOfVigor:
				return 1;
			case CardIds.ElixirOfVigorTavernBrawl:
				return 2;
			default:
				return null;
		}
	}

	private buildRelatedCardIds(
		cardId: string,
		deck: DeckState,
		existingCardIds: readonly string[],
	): readonly string[] {
		switch (cardId) {
			case CardIds.PhotographerFizzle_FizzlesSnapshotToken:
				// console.debug(
				// 	'setting related card ids',
				// 	deck.hand.map((c) => c.cardId),
				// );
				return deck.hand.map((c) => c.cardId ?? `${c.entityId}`);
			default:
				return existingCardIds ?? [];
		}
	}

	private buildCardName(card: any, creatorCardId: string): string {
		if (card) {
			return this.i18n.getCardName(card.id);
		}
		if (creatorCardId) {
			return this.i18n.getCreatedByCardName(creatorCardId);
		}
		return null;
	}
}

export const buildPositionFromBottom = (deck: DeckState, creatorCardId: string): number => {
	switch (creatorCardId) {
		// TODO: radar detector
		case CardIds.AmbassadorFaelin_TSC_067:
		case CardIds.AzsharanDefector:
		case CardIds.AzsharanGardens:
		case CardIds.AzsharanMooncatcher_TSC_644:
		case CardIds.AzsharanMooncatcher_Story_11_AzsharanMoonPuzzle:
		case CardIds.AzsharanRitual:
		case CardIds.AzsharanSaber:
		case CardIds.AzsharanScavenger:
		case CardIds.AzsharanScroll:
		case CardIds.AzsharanSentinel:
		case CardIds.AzsharanSweeper_TSC_776:
		case CardIds.AzsharanSweeper_Story_11_AzsharanSweeper:
		case CardIds.AzsharanTrident:
		case CardIds.AzsharanVessel:
		case CardIds.BootstrapSunkeneer: // TODO: not sure this belongs here in this parser
		case CardIds.Bottomfeeder:
		case CardIds.DisposalAssistant_WW_041:
		case CardIds.SludgeOnWheels_WW_043:
			return DeckCard.deckIndexFromBottom++;
	}
	return undefined;
};

export const buildPositionFromTop = (
	deck: DeckState,
	creatorCardId: string,
	lastInfluencedByCardId: string,
): number => {
	switch (creatorCardId) {
		case CardIds.MerchSeller:
			return 0;
	}
	switch (lastInfluencedByCardId) {
		case CardIds.Overplanner_VAC_444:
			return 0;
	}
	return undefined;
};

const buildAttributeChange = (creatorCard: DeckCard, newCardId: string): number => {
	// console.debug('building attribute change', card);
	// If the card is played by an effect (eg Manaling), it's possible that the creatorCard
	// doesn't have the correct id
	if (isCorrectCardId(creatorCard, newCardId, CardIds.Ignite)) {
		return 1 + (creatorCard.mainAttributeChange ?? 0);
	}
	if (isCorrectCardId(creatorCard, newCardId, CardIds.FloppyHydra_TOY_897)) {
		return 1 + (creatorCard.mainAttributeChange ?? 0);
	}
	if (
		isCorrectCardId(creatorCard, newCardId, CardIds.RenosMagicalTorch) ||
		isCorrectCardId(creatorCard, newCardId, CardIds.RenosMagicalTorchTavernBrawl)
	) {
		return 1 + (creatorCard.mainAttributeChange ?? 0);
	}
	if (isCorrectCardId(creatorCard, newCardId, CardIds.Bottomfeeder)) {
		return 1 + (creatorCard.mainAttributeChange ?? 0);
	}
	if (isCorrectCardId(creatorCard, newCardId, CardIds.StudentOfTheStars)) {
		return 1 + (creatorCard.mainAttributeChange ?? 0);
	}
	if (isCorrectCardId(creatorCard, newCardId, CardIds.SunscaleRaptor)) {
		return 1 + (creatorCard.mainAttributeChange ?? 0);
	}
	return null;
};

const isCorrectCardId = (creatorCard: DeckCard, newCardId: string, target: CardIds): boolean => {
	return creatorCard?.cardId === target || newCardId === target;
};
