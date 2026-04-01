import { CardIds, GameFormat, GameType } from '@firestone-hs/reference-data';
import { Preferences } from '@firestone/shared/common/service';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { GameState } from '../../models/game-state';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { YsondreCounterDefinitionV2 } from './ysondre';

describe('YsondreCounterDefinitionV2', () => {
	const ysondreId = CardIds.Ysondre_EDR_465;
	const bgState = new BattlegroundsState();

	let allCards: CardsFacadeService;
	let i18n: ILocalizationService;
	let counter: YsondreCounterDefinitionV2;

	const prefsBothOn = {
		playerYsondreCounter: true,
		opponentYsondreCounter: true,
	} as unknown as Preferences;

	beforeEach(() => {
		allCards = {} as CardsFacadeService;
		i18n = { translateString: (key: string) => key } as ILocalizationService;
		counter = new YsondreCounterDefinitionV2(i18n, allCards);
		counter.init({ arena: [] });
	});

	const baseMetadata = Object.assign(new Metadata(), {
		gameType: GameType.GT_RANKED,
		formatType: GameFormat.FT_STANDARD,
		scenarioId: 0,
	});

	it('when only the opponent’s Ysondre has died, shows on opponent column only', () => {
		const gameState = GameState.create({
			gameStarted: true,
			gameEnded: false,
			metadata: baseMetadata,
			playerDeck: DeckState.create({
				minionsDeadThisMatch: [],
			}),
			opponentDeck: DeckState.create({
				minionsDeadThisMatch: [{ entityId: 1, cardId: ysondreId }],
			}),
		});

		expect(counter.isActive('player', gameState, bgState, prefsBothOn)).toBe(false);
		expect(counter.isActive('opponent', gameState, bgState, prefsBothOn)).toBe(true);
	});

	it('when only your Ysondre has died, shows on player column only', () => {
		const gameState = GameState.create({
			gameStarted: true,
			gameEnded: false,
			metadata: baseMetadata,
			playerDeck: DeckState.create({
				minionsDeadThisMatch: [{ entityId: 2, cardId: ysondreId }],
			}),
			opponentDeck: DeckState.create({
				minionsDeadThisMatch: [],
			}),
		});

		expect(counter.isActive('player', gameState, bgState, prefsBothOn)).toBe(true);
		expect(counter.isActive('opponent', gameState, bgState, prefsBothOn)).toBe(false);
	});
});
