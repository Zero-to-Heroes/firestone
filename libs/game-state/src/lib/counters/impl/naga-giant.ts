/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState, ShortCard } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class NagaGiantCounterDefinitionV2 extends CounterDefinitionV2<{
	spellsPlayedThisMatch: readonly ShortCard[];
	manaSpentOnSpellsThisMatch: number;
}> {
	public override id: CounterType = 'nagaGiant';
	public override image = CardIds.NagaGiant;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.NagaGiant];

	readonly player = {
		pref: 'playerNagaGiantCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return {
				spellsPlayedThisMatch: state.playerDeck.spellsPlayedThisMatch,
				manaSpentOnSpellsThisMatch: state.playerDeck.manaSpentOnSpellsThisMatch,
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.naga-giant-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.naga-giant-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string | null {
		const value = this[side]?.value(gameState);
		if (!value) {
			return null;
		}

		const giantBaseCost = this.allCards.getCard(CardIds.NagaGiant).cost!;
		const spellsPlayed = value.spellsPlayedThisMatch?.length ?? 0;
		const totalCostReduction = value.manaSpentOnSpellsThisMatch ?? 0;
		const costAfterReduction = Math.max(0, giantBaseCost - totalCostReduction);
		return this.i18n.translateString(`counters.naga-giant.${side}`, {
			cost: costAfterReduction,
			spells: spellsPlayed,
			spellsMana: totalCostReduction,
		});
	}
}
