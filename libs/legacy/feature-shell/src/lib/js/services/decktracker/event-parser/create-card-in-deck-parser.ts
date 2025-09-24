import { CardIds, CardType, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { reverseIfNeeded } from '@legacy-import/src/lib/js/services/decktracker/event-parser/card-dredged-parser';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

const CREATE_ON_TOP = [CardIds.MerchSeller, CardIds.DemonicDeal_WORK_014, CardIds.SweetDreamsToken_EDR_100t8];

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
				refManaCost: cost,
				metaInfo: undefined,
				creatorCardId: gameEvent.additionalData.creatorCardId,
				creatorEntityId: gameEvent.additionalData.creatorEntityId,
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
			(gameEvent.additionalData.creatorEntityId ?? gameEvent.additionalData.influencedByEntityId)
				? +(gameEvent.additionalData.creatorEntityId ?? gameEvent.additionalData.influencedByEntityId)
				: null;
		const creatorEntity = creatorEntityId
			? // Because sometimes the entityId is reversed in the Other zone
				(deck.findCard(creatorEntityId)?.card ?? deck.findCard(-creatorEntityId)?.card)
			: null;
		const shouldHideCreator =
			// In this case, the card is removed from the deck then put back, so we're actually putting back the original
			// card
			gameEvent.additionalData.influencedByCardId === CardIds.Overplanner_VAC_444 ||
			// And here we're putting back the original card, but only if it itself was not "created by"
			(gameEvent.additionalData.creatorCardId === CardIds.AdaptiveAmalgam_VAC_958 &&
				!creatorEntity?.creatorCardId);
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
		// console.debug('[create-card-in-deck]', 'card added', card, zone, gameEvent, deck);
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
				refManaCost: cardData?.cost,
				actualManaCost:
					this.buildKnownUpdatedManaCost(gameEvent.additionalData.creatorCardId) ?? cardData?.cost,
				rarity: cardData?.rarity?.toLowerCase(),
				creatorCardId: shouldHideCreator
					? null
					: (creatorEntity?.cardId ??
						gameEvent.additionalData.creatorCardId ??
						gameEvent.additionalData.influencedByEntityId),
				creatorEntityId: shouldHideCreator ? null : gameEvent.additionalData.creatorEntityId,
				mainAttributeChange: buildAttributeChange(creatorEntity, newCardId),
				positionFromBottom: positionFromBottom,
				positionFromTop: positionFromTop,
				createdByJoust: createdByJoust,
				temporaryCard: false,
				zone: undefined,
			} as DeckCard)
			.update({
				relatedCardIds: this.buildRelatedCardIds(
					newCardId,
					deck,
					card?.relatedCardIds,
					gameEvent.additionalData.creatorCardId,
				),
			});
		card = card.update(buildKnownFields(card, gameEvent.additionalData.creatorCardId));

		console.debug('[create-card-in-deck]', 'adding card', card, gameEvent);

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
			case CardIds.TomeTampering:
			case CardIds.TomeTampering_CORE_REV_240:
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
		creatorCardId: string,
	): readonly string[] {
		// console.debug('creating card in deck', cardId, creatorCardId, existingCardIds);
		switch (cardId) {
			case CardIds.PhotographerFizzle_FizzlesSnapshotToken:
				if (creatorCardId === CardIds.PhotographerFizzle) {
					return deck.hand.map((c) => c.cardId ?? `${c.entityId}`);
				} else {
					// Snapshot is "once per game" now, so this case shouldn't really matter anymore
					return existingCardIds ?? [];
				}
			default:
				return existingCardIds ?? [];
		}
	}

	private buildCardName(card: ReferenceCard, creatorCardId: string): string {
		if (card) {
			return card.name;
		}
		if (creatorCardId) {
			return this.i18n.getCreatedByCardName(this.allCards.getCard(creatorCardId).name);
		}
		return null;
	}
}

// Maybe merge that with what we do for card in hand
export const buildKnownFields = (card: DeckCard, creatorCardId: string): Partial<DeckCard> => {
	console.debug('[create-card-in-deck] adding known fields', card, creatorCardId);
	switch (creatorCardId) {
		case CardIds.Blasteroid_GDB_303:
			return {
				guessedInfo: {
					...(card.guessedInfo ?? {}),
					cardType: CardType.SPELL,
					spellSchools: [SpellSchool.FIRE],
				},
			};
		default:
			return {};
	}
};

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
		case CardIds.Meadowstrider_EDR_978:
			return DeckCard.deckIndexFromBottom++;
	}
	return undefined;
};

export const buildPositionFromTop = (
	deck: DeckState,
	creatorCardId: string,
	lastInfluencedByCardId: string,
): number => {
	if (CREATE_ON_TOP.includes(creatorCardId as CardIds)) {
		return DeckCard.deckIndexFromTop--;
	}
	switch (lastInfluencedByCardId) {
		case CardIds.Overplanner_VAC_444:
			return DeckCard.deckIndexFromTop--;
	}
	return undefined;
};

const buildAttributeChange = (creatorCard: DeckCard, newCardId: string): number => {
	// if (!creatorCard) {
	// 	return null;
	// }
	// console.debug('building attribute change', card);
	// If the card is played by an effect (eg Manaling), it's possible that the creatorCard
	// doesn't have the correct id
	if (isCorrectCardId(creatorCard, newCardId, CardIds.Ignite)) {
		return 1 + (creatorCard.mainAttributeChange ?? 0);
	}
	if (isCorrectCardId(creatorCard, newCardId, CardIds.AdaptiveAmalgam_VAC_958)) {
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

// const updateSpecificFields = (card: DeckCard, creatorCardId: string): Partial<DeckCard> => {
// 	switch (creatorCardId) {
// 		case CardIds.TomeTampering:
// 		case CardIds.TomeTampering_CORE_REV_240:
// 			return { refManaCost: 1 };
// 		default:
// 			return {};
// 	}
// };
