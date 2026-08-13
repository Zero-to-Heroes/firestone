import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EntityUpdateParser } from './entity-update-parser';

describe('EntityUpdateParser (ranked spells leave initial deckList unchanged)', () => {
	const localPlayer = { PlayerId: 2 } as GameEvent['localPlayer'];
	const opponentPlayer = { PlayerId: 1 } as GameEvent['opponentPlayer'];

	const allCards = {
		getCard: (id: string) =>
			({
				id,
				name: id,
				cost: 1,
				mechanics: [],
				type: 'Spell',
				rarity: 'Rare',
			}) as ReturnType<CardsFacadeService['getCard']>,
		getService: () => allCards as unknown as CardsFacadeService,
	} as unknown as CardsFacadeService;

	const i18n = { translateString: (key: string) => key } as ILocalizationService;

	let helper: DeckManipulationHelper;
	let parser: EntityUpdateParser;

	beforeEach(() => {
		helper = new DeckManipulationHelper(allCards, i18n);
		parser = new EntityUpdateParser(helper, allCards);
	});

	it('updates the deck-zone copy on upgrade (ONY_016 → ONY_016t) but keeps the initial deckList row', async () => {
		const entityId = 50;
		const state = GameState.create({
			currentTurn: 5,
			playerDeck: DeckState.create({
				deckList: [
					DeckCard.create({ cardId: 'ONY_016', entityId: 0, refManaCost: 1 }),
					DeckCard.create({ cardId: 'VAC_928', entityId: 0, refManaCost: 2 }),
				],
				deck: [
					DeckCard.create({
						cardId: 'ONY_016',
						entityId,
						refManaCost: 1,
						cardName: 'Wings of Hate (Rank 1)',
					}),
				],
				hand: [],
			}),
			opponentDeck: DeckState.create({}),
		});

		const gameEvent = GameEvent.build(
			GameEvent.ENTITY_UPDATE,
			{
				Value: {
					CardId: 'ONY_016t',
					ControllerId: 2,
					EntityId: entityId,
					LocalPlayer: localPlayer,
					OpponentPlayer: opponentPlayer,
				},
			},
			{ revealed: true },
		);

		const next = await parser.parse(state, gameEvent);
		expect(next.playerDeck.deck[0].cardId).toBe('ONY_016t');
		expect(next.playerDeck.deckList[0].cardId).toBe('ONY_016');
		expect(next.playerDeck.deckList[1].cardId).toBe('VAC_928');
	});
});
