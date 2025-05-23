import { CardClass, CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class ProtossSpellsCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'protossSpells';
	public override image = CardIds.Colossus_SC_758;
	public override cards: readonly CardIds[] = [CardIds.Colossus_SC_758];

	readonly player = {
		pref: 'playerProtossSpellsCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null =>
			state.playerDeck?.spellsPlayedThisMatch?.filter((s) =>
				this.allCards.getCard(s.cardId).mechanics?.includes(GameTag[GameTag.PROTOSS]),
			)?.length ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.colossus-damage-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.colossus-damage-tooltip', {
					cardName: allCards.getCard(CardIds.Colossus_SC_758).name,
				}),
		},
	};

	readonly opponent = {
		pref: 'opponentProtossSpellsCounter' as const,
		display: (state: GameState): boolean => {
			return initialHeroClassIs(state.opponentDeck?.hero, [CardClass.MAGE]);
		},
		value: (state: GameState): number | null =>
			state.opponentDeck?.spellsPlayedThisMatch?.filter((s) =>
				this.allCards.getCard(s.cardId).mechanics?.includes(GameTag[GameTag.PROTOSS]),
			)?.length ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.colossus-damage-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.colossus-damage-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override formatValue(value: number): string {
		return value === 0 ? `2 x 1` : `2 x ( 1 + ${value})`;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.colossus-damage.${side}`, {
			value: this[side]?.value(gameState) ?? 0,
		});
	}
}
