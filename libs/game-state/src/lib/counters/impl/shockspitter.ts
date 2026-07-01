/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds, CardType, GameFormat, GameType } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { filterCards } from '../../services/cards/utils';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class ShockspitterCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'shockspitter';
	public override image = CardIds.InfesttheScullery_JAIL_200;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.Shockspitter,
		CardIds.KurtrusDemonRender,
		CardIds.InfesttheScullery_JAIL_200,
	];

	readonly player = {
		pref: 'playerShockspitterCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.heroAttacksThisMatch ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.hero-attacks-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.hero-attacks-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentShockspitterCounter' as const,
		display: (state: GameState): boolean =>
			(state?.metadata?.formatType === GameFormat.FT_WILD &&
				initialHeroClassIs(state.opponentDeck.hero, [CardClass.HUNTER])) ||
			initialHeroClassIs(state.opponentDeck.hero, [CardClass.DRUID]),
		value: (state: GameState) => {
			return state.opponentDeck.heroAttacksThisMatch || null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.hero-attacks-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.hero-attacks-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	override cardTooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		value: number | null | undefined,
	): readonly string[] | undefined {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (deck.hasRelevantCard([CardIds.InfesttheScullery_JAIL_200])) {
			const value = this[side]?.value(gameState) ?? 0;
			const cost = Math.min(10, value + 4);
			return filterCards(
				CardIds.InfesttheScullery_JAIL_200,
				this.allCards.getService(),
				(c) => hasCost(c, '==', cost) && hasCorrectType(c, CardType.MINION),
				{
					format: gameState.metadata?.formatType ?? GameFormat.FT_STANDARD,
					gameType: gameState.metadata?.gameType ?? GameType.GT_RANKED,
					scenarioId: gameState.metadata?.scenarioId ?? 0,
					validArenaPool: this.curatedPools?.arena ?? [],
					currentClass: gameState.playerDeck.getCurrentClass()!,
					initialDecklist: gameState.playerDeck.deckList?.map((c) => c.cardId) ?? undefined,
				},
			);
		}
		return undefined;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.hero-attacks.${side}`, { times: value });
	}
}
