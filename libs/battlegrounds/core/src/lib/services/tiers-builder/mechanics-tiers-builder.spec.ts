import { GameTag, ReferenceCard } from '@firestone-hs/reference-data';
import { isInMechanicalTier, MAIN_MECHANICS_IN_GAME, MECHANICS_IN_GAME } from './mechanics-tiers-builder';

describe('mechanics-tiers-builder', () => {
	describe('MAIN_MECHANICS_IN_GAME', () => {
		it('includes Activate as INTERACTABLE_OBJECT', () => {
			expect(MAIN_MECHANICS_IN_GAME.map((m) => m.mechanic)).toContain(GameTag.INTERACTABLE_OBJECT);
		});
	});

	describe('MECHANICS_IN_GAME', () => {
		it('has unique mechanic values', () => {
			const mechanics = MECHANICS_IN_GAME.map((m) => m.mechanic);
			expect(mechanics).toEqual([...new Set(mechanics)]);
		});
	});

	describe('isInMechanicalTier', () => {
		const card = (overrides: Partial<ReferenceCard> = {}): ReferenceCard =>
			({
				id: 'TEST',
				name: 'Test',
				...overrides,
			}) as ReferenceCard;

		it('matches when the tag is only in referencedTags', () => {
			expect(isInMechanicalTier(card({ referencedTags: [GameTag[GameTag.DISCOVER]] }), GameTag.DISCOVER)).toBe(
				true,
			);
			expect(
				isInMechanicalTier(card({ referencedTags: [GameTag[GameTag.CHOOSE_ONE]] }), GameTag.CHOOSE_ONE),
			).toBe(true);
		});

		it('matches Activate from INTERACTABLE_OBJECT mechanics', () => {
			expect(
				isInMechanicalTier(
					card({ mechanics: [GameTag[GameTag.INTERACTABLE_OBJECT]] }),
					GameTag.INTERACTABLE_OBJECT,
				),
			).toBe(true);
		});

		it('does not match unrelated tags', () => {
			expect(isInMechanicalTier(card({ mechanics: [GameTag[GameTag.BATTLECRY]] }), GameTag.DISCOVER)).toBe(false);
		});
	});
});
