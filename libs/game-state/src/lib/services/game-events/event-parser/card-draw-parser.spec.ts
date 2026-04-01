import { CardIds } from '@firestone-hs/reference-data';
import { ArenaRefService } from '@firestone/arena/data-access';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { CardDrawParser } from './card-draw-parser';

describe('CardDrawParser', () => {
	const testCardId = CardIds.MurlocRaiderLegacy;
	const testEntityId = 9001;

	const localPlayer = { PlayerId: 1 } as GameEvent['localPlayer'];

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
	const arenaRef = {
		validDiscoveryPool$$: { value: [] as readonly string[] },
	} as unknown as ArenaRefService;

	let helper: DeckManipulationHelper;
	let parser: CardDrawParser;

	beforeEach(() => {
		helper = new DeckManipulationHelper(allCards, i18n);
		parser = new CardDrawParser(helper, allCards, arenaRef);
	});

	function baseGameState(): GameState {
		return GameState.create({
			currentTurn: 7,
			playerDeck: DeckState.create({
				deck: [
					DeckCard.create({
						cardId: testCardId,
						entityId: testEntityId,
						cardName: 'TestCard',
						refManaCost: 1,
					}),
				],
				cardsDrawnByTurn: [{ turn: 7, value: 3 }],
				hand: [],
				deckList: [],
			}),
			opponentDeck: DeckState.create({}),
		});
	}

	function buildDrawEvent(additional: Record<string, unknown>): GameEvent {
		return GameEvent.build(
			GameEvent.CARD_DRAW_FROM_DECK,
			{
				Value: {
					CardId: testCardId,
					ControllerId: 1,
					EntityId: testEntityId,
					LocalPlayer: localPlayer,
					OpponentPlayer: { PlayerId: 2 },
				},
			},
			{
				drawnByCardId: additional['drawnByCardId'],
				drawnByEntityId: additional['drawnByEntityId'],
				lastInfluencedByCardId: additional['lastInfluencedByCardId'],
				cost: 1,
				tags: undefined,
				...additional,
			},
		);
	}

	it('does not increment cardsDrawnByTurn when LastInfluencedByCardId is Secret Passage', async () => {
		const state = baseGameState();
		const event = buildDrawEvent({ lastInfluencedByCardId: CardIds.SecretPassage });
		const next = await parser.parse(state, event);
		const entry = next.playerDeck.cardsDrawnByTurn.find((t) => t.turn === 7);
		expect(entry?.value).toBe(3);
	});

	it('does not increment cardsDrawnByTurn when DrawnByCardId is Secret Passage', async () => {
		const state = baseGameState();
		const event = buildDrawEvent({
			lastInfluencedByCardId: undefined,
			drawnByCardId: CardIds.SecretPassage,
		});
		const next = await parser.parse(state, event);
		const entry = next.playerDeck.cardsDrawnByTurn.find((t) => t.turn === 7);
		expect(entry?.value).toBe(3);
	});

	it('increments cardsDrawnByTurn for a normal draw', async () => {
		const state = baseGameState();
		const event = buildDrawEvent({
			lastInfluencedByCardId: undefined,
			drawnByCardId: undefined,
		});
		const next = await parser.parse(state, event);
		const entry = next.playerDeck.cardsDrawnByTurn.find((t) => t.turn === 7);
		expect(entry?.value).toBe(4);
	});
});
