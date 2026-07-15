import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { CardIds } from '@firestone-hs/reference-data';
import { DeckManipulationHelper, reconcileCardInHandWithDeck } from './deck-manipulation-helper';

describe('DeckManipulationHelper.removeSingleCardFromZone', () => {
	const testCardId = CardIds.MurlocRaiderLegacy;

	const allCards = {
		getCard: (id: string) =>
			({
				id,
				name: 'TestCard',
				cost: 1,
				mechanics: [],
				type: 'Minion',
				rarity: 'Free',
			}) as ReturnType<CardsFacadeService['getCard']>,
		getService: () => allCards as unknown as CardsFacadeService,
	} as unknown as CardsFacadeService;

	const i18n = { translateString: (key: string) => key } as ILocalizationService;

	let helper: DeckManipulationHelper;

	beforeEach(() => {
		helper = new DeckManipulationHelper(allCards, i18n);
	});

	it('removes by cardId when event entityId is not in zone and deck rows have no entityId (draw from deckstring)', () => {
		const zone = [
			DeckCard.create({ cardId: testCardId, refManaCost: 1 }),
			DeckCard.create({ cardId: testCardId, refManaCost: 1 }),
		];
		const drawEntityIdFromGame = 55_001;
		const [newZone, removed] = helper.removeSingleCardFromZone(zone, testCardId, drawEntityIdFromGame);
		expect(removed?.cardId).toBe(testCardId);
		expect(newZone.length).toBe(1);
		expect(newZone.filter((c) => c.cardId === testCardId).length).toBe(1);
	});

	it('returns unchanged zone when entityId is missing from zone but every same-cardId row has an entityId (Zugars hand ambiguity)', () => {
		const zone = [
			DeckCard.create({ cardId: testCardId, entityId: 101, refManaCost: 1 }),
			DeckCard.create({ cardId: testCardId, entityId: 102, refManaCost: 1 }),
			DeckCard.create({ cardId: testCardId, entityId: 103, refManaCost: 1 }),
		];
		const entityIdNotYetInHand = 999;
		const [newZone, removed] = helper.removeSingleCardFromZone(zone, testCardId, entityIdNotYetInHand);
		expect(removed).toBeUndefined();
		expect(newZone).toBe(zone);
		expect(newZone.length).toBe(3);
	});

	it('still removes by entityId when it matches a row', () => {
		const zone = [
			DeckCard.create({ cardId: testCardId, entityId: 101, refManaCost: 1 }),
			DeckCard.create({ cardId: testCardId, entityId: 102, refManaCost: 1 }),
		];
		const [newZone, removed] = helper.removeSingleCardFromZone(zone, testCardId, 102);
		expect(removed?.entityId).toBe(102);
		expect(newZone.length).toBe(1);
		expect(newZone[0].entityId).toBe(101);
	});

	it('removes first creatorCardId row when entityId is hidden on opponent deck rows', () => {
		const malchezaar = CardIds.PrinceMalchezaar_KAR_096;
		const zone = [
			DeckCard.create({ creatorCardId: malchezaar, trueEntityId: 80 }),
			DeckCard.create({ creatorCardId: malchezaar, trueEntityId: 81 }),
		];
		const [newZone, removed] = helper.removeSingleCardFromZone(zone, null, -1, true, true, null, false, {
			fallbackCreatorCardId: malchezaar,
		});
		expect(removed?.creatorCardId).toBe(malchezaar);
		expect(removed?.trueEntityId).toBe(80);
		expect(newZone.length).toBe(1);
		expect(newZone[0].trueEntityId).toBe(81);
	});
});

describe('reconcileCardInHandWithDeck', () => {
	const allCards = {
		getCard: (id: string) =>
			({
				id,
				name: 'TestCard',
				cost: 1,
				mechanics: [],
				type: 'Minion',
				rarity: 'Free',
			}) as ReturnType<CardsFacadeService['getCard']>,
		getService: () => allCards as unknown as CardsFacadeService,
	} as unknown as CardsFacadeService;

	const i18n = { translateString: (key: string) => key } as ILocalizationService;
	let helper: DeckManipulationHelper;

	beforeEach(() => {
		helper = new DeckManipulationHelper(allCards, i18n);
	});

	it('removes known opponent deck copy by cardId on play after hidden draw (trade reveal)', () => {
		const tradedCardId = CardIds.RustrotViperCore;
		const tradedEntityId = 21;
		const opponentDeck = DeckState.create({
			deck: [
				DeckCard.create({
					cardId: tradedCardId,
					cardName: 'Rustrot Viper',
					refManaCost: 3,
				}),
			],
			hand: [],
		});
		const removedFromHand = DeckCard.create({
			entityId: tradedEntityId,
		});

		const result = reconcileCardInHandWithDeck({
			removedCard: removedFromHand,
			cardId: tradedCardId,
			entityId: tradedEntityId,
			deck: opponentDeck,
			deckCards: opponentDeck.deck,
			opponentDeck: DeckState.create({}),
			helper,
		});

		expect(result.deckCards.some((c) => c.cardId === tradedCardId)).toBe(false);
		expect(result.deckCards).toEqual([]);
	});

	it('keeps a known deck copy when an unrelated generated card with the same cardId is played', () => {
		// Amalgam rewind non-reg scenario: entity 29 is a known Nightmare Fuel copy in the deck
		// (revealed via COPIED_FROM_ENTITY_ID), while the played card is a *generated* Nightmare Fuel
		// (created into hand, never came from the deck). The deck row must stay.
		const sharedCardId = 'EDR_528';
		const knownDeckCopy = DeckCard.create({
			cardId: sharedCardId,
			cardName: 'Nightmare Fuel',
			entityId: 29,
			refManaCost: 1,
		});
		const opponentDeck = DeckState.create({
			deck: [knownDeckCopy],
			hand: [],
		});
		const generatedCardInHand = DeckCard.create({
			entityId: 162,
			creatorCardId: 'SOME_CREATOR',
			creatorEntityId: 25,
		});

		const result = reconcileCardInHandWithDeck({
			removedCard: generatedCardInHand,
			cardId: sharedCardId,
			entityId: 162,
			deck: opponentDeck,
			deckCards: opponentDeck.deck,
			opponentDeck: DeckState.create({}),
			helper,
		});

		expect(result.deckCards.some((c) => c.cardId === sharedCardId)).toBe(true);
		expect(result.deckCards.length).toBe(1);
	});

	it('removes the known deck copy when the played card shares the same creator (generated then traded back)', () => {
		const sharedCardId = CardIds.RustrotViperCore;
		const creatorCardId = 'SOME_GENERATOR';
		const knownDeckCopy = DeckCard.create({
			cardId: sharedCardId,
			cardName: 'Rustrot Viper',
			creatorCardId: creatorCardId,
			refManaCost: 3,
		});
		const opponentDeck = DeckState.create({
			deck: [knownDeckCopy],
			hand: [],
		});
		const removedFromHand = DeckCard.create({
			entityId: 21,
			creatorCardId: creatorCardId,
		});

		const result = reconcileCardInHandWithDeck({
			removedCard: removedFromHand,
			cardId: sharedCardId,
			entityId: 21,
			deck: opponentDeck,
			deckCards: opponentDeck.deck,
			opponentDeck: DeckState.create({}),
			helper,
		});

		expect(result.deckCards.some((c) => c.cardId === sharedCardId)).toBe(false);
		expect(result.deckCards).toEqual([]);
	});

	it('does not remove a local deck copy when opponent plays a hidden card with the same cardId (not stolen)', () => {
		const sharedCardId = CardIds.HexCore;
		const opponentEntityId = 58;
		const localDeck = DeckState.create({
			deck: [
				DeckCard.create({
					cardId: sharedCardId,
					cardName: 'Hex',
					refManaCost: 3,
				}),
			],
			hand: [],
		});
		const opponentPlayingDeck = DeckState.create({
			deck: [],
			hand: [],
		});
		const removedFromHand = DeckCard.create({
			entityId: opponentEntityId,
		});

		const result = reconcileCardInHandWithDeck({
			removedCard: removedFromHand,
			cardId: sharedCardId,
			entityId: opponentEntityId,
			deck: opponentPlayingDeck,
			deckCards: opponentPlayingDeck.deck,
			opponentDeck: localDeck,
			helper,
		});

		expect(result.opponentDeck.deck.some((c) => c.cardId === sharedCardId)).toBe(true);
		expect(result.opponentDeck.deck).toHaveLength(1);
	});

	it('removes a natural deck copy from the opposite deck when opponent plays a stolen hidden card revealed on play', () => {
		const stolenCardId = CardIds.ConcealingConfection_JAIL_460;
		const stolenEntityId = 32;
		const localDeck = DeckState.create({
			deck: [
				DeckCard.create({
					cardId: stolenCardId,
					cardName: 'Concealing Confection',
					refManaCost: 1,
				}),
			],
			hand: [],
		});
		const opponentPlayingDeck = DeckState.create({
			deck: [],
			hand: [
				DeckCard.create({
					entityId: stolenEntityId,
					cardId: stolenCardId,
					cardName: 'Concealing Confection',
					refManaCost: 1,
				}),
			],
		});
		const removedFromHand = DeckCard.create({
			entityId: stolenEntityId,
			stolenFromOpponent: true,
		});

		const result = reconcileCardInHandWithDeck({
			removedCard: removedFromHand,
			cardId: stolenCardId,
			entityId: stolenEntityId,
			deck: opponentPlayingDeck,
			deckCards: opponentPlayingDeck.deck,
			opponentDeck: localDeck,
			helper,
		});

		expect(result.opponentDeck.deck.some((c) => c.cardId === stolenCardId)).toBe(false);
		expect(result.opponentDeck.deck).toEqual([]);
	});

	it('removes from opposite deck on play when hand card has stolenFromOpponent (Chronogor)', () => {
		const stolenCardId = CardIds.ConcealingConfection_JAIL_460;
		const stolenEntityId = 32;
		const localDeck = DeckState.create({
			deck: [
				DeckCard.create({
					cardId: stolenCardId,
					cardName: 'Concealing Confection',
					refManaCost: 1,
				}),
			],
			hand: [],
		});
		const opponentPlayingDeck = DeckState.create({ deck: [], hand: [] });
		const removedFromHand = DeckCard.create({
			entityId: stolenEntityId,
			stolenFromOpponent: true,
			creatorCardId: CardIds.Chronogor_TIME_032,
		});

		const result = reconcileCardInHandWithDeck({
			removedCard: removedFromHand,
			cardId: stolenCardId,
			entityId: stolenEntityId,
			deck: opponentPlayingDeck,
			deckCards: opponentPlayingDeck.deck,
			opponentDeck: localDeck,
			helper,
		});

		expect(result.opponentDeck.deck.some((c) => c.cardId === stolenCardId)).toBe(false);
		expect(result.opponentDeck.deck).toEqual([]);
	});
});
