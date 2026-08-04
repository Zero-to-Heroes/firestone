import { CardIds, CardType, GameFormat, GameTag, GameType } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { ParserGameStateLite } from '@firestone/power-log-parser';
import { DeckCard } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GameState } from '../../models/game-state';
import { Metadata } from '../../models/metadata';
import { sanitizeParserStateForElectron } from '../../services/parser-entity-utils';
import { BashanaCounterDefinitionV2 } from './bashana';

describe('BashanaCounterDefinitionV2', () => {
	const bashanaId = CardIds.BashanaRunetotem_MEND_046;
	const treantTokenId = CardIds.BashanaRunetotem_TreantToken_MEND_046t;

	let allCards: CardsFacadeService;
	let i18n: ILocalizationService;
	let counter: BashanaCounterDefinitionV2;

	beforeEach(() => {
		allCards = {} as CardsFacadeService;
		i18n = { translateString: (key: string) => key } as ILocalizationService;
		counter = new BashanaCounterDefinitionV2(i18n, allCards);
		counter.init({ arena: [] });
	});

	const baseMetadata = Object.assign(new Metadata(), {
		gameType: GameType.GT_RANKED,
		formatType: GameFormat.FT_STANDARD,
		scenarioId: 0,
	});

	it('computes remaining mana from sanitized Electron parser entities', () => {
		const bashanaEntityId = 100;
		const treantEntityId = 201;
		const spellEntityId = 301;

		const rawParserState = {
			CurrentEntities: new Map([
				[
					treantEntityId,
					{
						Id: treantEntityId,
						CardId: treantTokenId,
						Tags: [{ Name: GameTag.CREATOR, Value: bashanaEntityId }],
					},
				],
				[
					spellEntityId,
					{
						Id: spellEntityId,
						CardId: 'TEST_SPELL',
						Tags: [
							{ Name: GameTag.CARDTYPE, Value: CardType.SPELL },
							{ Name: GameTag.CREATOR, Value: treantEntityId },
							{ Name: GameTag.COST, Value: 3 },
						],
					},
				],
			]),
			ControllerEntityMap: new Map(),
		} as ParserGameStateLite;

		const gameState = GameState.create({
			gameStarted: true,
			gameEnded: false,
			metadata: baseMetadata,
			opponentDeck: DeckState.create({
				hand: [
					DeckCard.create({
						cardId: treantTokenId,
						creatorCardId: bashanaId,
						creatorEntityId: bashanaEntityId,
					}),
					DeckCard.create({
						cardId: treantTokenId,
						creatorCardId: bashanaId,
						creatorEntityId: bashanaEntityId,
					}),
				],
			}),
			parserState: sanitizeParserStateForElectron(rawParserState),
		});

		const value = counter.opponent!.value(gameState);
		expect(value).toEqual({ treantsLeft: 2, totalMana: 9 });
	});
});
