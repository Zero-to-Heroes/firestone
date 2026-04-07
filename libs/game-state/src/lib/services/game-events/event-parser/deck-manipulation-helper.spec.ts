import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { DeckManipulationHelper } from './deck-manipulation-helper';

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
});
