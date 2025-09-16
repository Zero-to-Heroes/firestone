/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds, GameFormat } from '@firestone-hs/reference-data';
import { groupByFunction2 } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class CorpseSpentCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'corpseSpent';
	public override image = CardIds.ClimacticNecroticExplosion;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.ClimacticNecroticExplosion, CardIds.StitchedGiantCore_RLK_744];

	readonly player = {
		pref: 'playerCorpseSpentCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.corpsesSpent ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.corpse-spent-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.corpse-spent-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentCorpseSpentCounter' as const,
		display: (state: GameState): boolean => {
			if (!initialHeroClassIs(state.opponentDeck.hero, [CardClass.DEATHKNIGHT])) {
				return false;
			}
			if (state.metadata.formatType === GameFormat.FT_STANDARD) {
				return false;
			}

			const entityIdsPlayed = state.opponentDeck.cardsPlayedThisMatch.map((c) => Math.abs(c.entityId));
			const cardsPlayedThisMatch = state.opponentDeck
				.getAllCardsInDeckWithoutOptions()
				.filter((c) => entityIdsPlayed.includes(Math.abs(c.entityId)));
			const costs = cardsPlayedThisMatch
				.filter((c) => !!c.cardId && !c.creatorCardId && !c.creatorEntityId)
				.map((c) => this.allCards.getCard(c.cardId))
				.filter((c) => !!c.additionalCosts)
				.map((c) => c.additionalCosts!);

			const allRuneEntries = costs.flatMap((c) =>
				Object.entries(c).map((entry) => ({
					rune: entry[0],
					quantity: entry[1],
				})),
			);
			const groupedByRune = groupByFunction2(allRuneEntries, (rune) => rune.rune);
			return Object.keys(groupedByRune).length === 3;
		},
		value: (state: GameState) => {
			return state.opponentDeck.corpsesSpent ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.corpse-spent-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.corpse-spent-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.corpse.${side}`, { value: value });
	}
}
