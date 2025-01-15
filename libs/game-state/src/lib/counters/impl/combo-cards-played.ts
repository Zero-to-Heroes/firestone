import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class ComboCardsPlayedCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'comboCardsPlayed';
	public override image = CardIds.RhymeSpinner;
	public override cards: readonly CardIds[] = [CardIds.RhymeSpinner];

	readonly player = {
		pref: 'playerComboCardsPlayedCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number => {
			const comboCardsPlayed = state.playerDeck?.cardsPlayedThisMatch?.filter((c) =>
				this.allCards.getCard(c.cardId).mechanics?.includes(GameTag[GameTag.COMBO]),
			);
			console.debug('combo cards played', comboCardsPlayed);
			return comboCardsPlayed?.length;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.combo-cards-played-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.combo-cards-played-tooltip', {
					cardName: allCards.getCard(CardIds.RhymeSpinner)?.name,
				}),
		},
	};

	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.combo-cards-played.${side}`, {
			value: side === 'player' ? this.player.value(gameState) : null,
		});
	}
}
