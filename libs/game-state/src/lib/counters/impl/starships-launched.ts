/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class StarshipsLaunchedCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'starshipsLaunched';
	public override image = CardIds.JimRaynor_SC_400;
	public override cards: readonly CardIds[] = [CardIds.JimRaynor_SC_400];

	readonly player = undefined;

	readonly opponent = {
		pref: 'opponentStarshipsLaunchedCounter' as const,
		display: (state: GameState): boolean => {
			const result =
				initialHeroClassIs(
					state.opponentDeck?.hero,
					this.allCards.getCard(CardIds.JimRaynor_SC_400).classes!.map((c) => CardClass[c]),
				) && state.opponentDeck.starshipsLaunched.length > 0;
			return result;
		},
		value: (state: GameState): number | null => state.opponentDeck.starshipsLaunched.length,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.starships-launched-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.starships-launched-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.starships-launched.${side}`, {
			value: this[side]?.value(gameState) ?? 0,
		});
	}

	protected override cardTooltip(side: 'player' | 'opponent', gameState: GameState): readonly string[] | undefined {
		const cardIds = getStarshipsLaunchedCardIds(side, gameState, this.allCards);
		console.debug('[spaceships-launched] related cards', cardIds);
		return cardIds;
	}
}

export const getStarshipsLaunchedCardIds = (
	side: 'player' | 'opponent',
	gameState: GameState,
	allCards: CardsFacadeService,
): readonly string[] => {
	const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
	const otherDeckState = side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
	const starshipsOwn = deckState
		.getAllCardsInDeckWithoutOptions()
		.filter((c) => !c.stolenFromOpponent)
		.filter((c) => allCards.getCard(c.cardId)?.mechanics?.includes(GameTag[GameTag.STARSHIP]))
		.filter((c) => c.tags[GameTag.LAUNCHPAD] !== 1);
	const starshipsStolen = otherDeckState
		.getAllCardsInDeckWithoutOptions()
		.filter((c) => c.stolenFromOpponent)
		.filter((c) => allCards.getCard(c.cardId)?.mechanics?.includes(GameTag[GameTag.STARSHIP]))
		.filter((c) => c.tags[GameTag.LAUNCHPAD] !== 1);
	const cardIds = [...starshipsOwn, ...starshipsStolen].flatMap((c) => [
		c.cardId,
		...(c.storedInformation?.cards
			?.filter((c) => allCards.getCard(c?.cardId).mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE]))
			?.map((c) => c.cardId) ?? []),
	]);
	return cardIds;
};
