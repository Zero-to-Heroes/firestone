/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class TableFlipCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'tableFlip';
	public override image = CardIds.TableFlip_TOY_883;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.TableFlip_TOY_883];

	readonly player = {
		pref: 'playerTableFlipCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			const baseCost = this.allCards.getCard(CardIds.TableFlip_TOY_883).cost!;
			const reduction = state.playerDeck.hand.length - 1;
			const newCost = Math.max(0, baseCost - reduction);
			return newCost;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.table-flip-label', {
					cardName: this.allCards.getCard(CardIds.TableFlip_TOY_883).name,
				}),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.table-flip-tooltip', {
					cardName: this.allCards.getCard(CardIds.TableFlip_TOY_883).name,
				}),
		},
	};
	readonly opponent = {
		pref: 'opponentTableFlipCounter' as const,
		display: (state: GameState): boolean => initialHeroClassIs(state.opponentDeck.hero, [CardClass.WARLOCK]),
		value: (state: GameState) => {
			const baseCost = this.allCards.getCard(CardIds.TableFlip_TOY_883).cost!;
			const reduction = state.opponentDeck.hand.length - 1;
			const newCost = Math.max(0, baseCost - reduction);
			return newCost;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.table-flip-label', {
					cardName: this.allCards.getCard(CardIds.TableFlip_TOY_883).name,
				}),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.table-flip-tooltip', {
					cardName: this.allCards.getCard(CardIds.TableFlip_TOY_883).name,
				}),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.specific-cost.${side}`, {
			value: value,
			cardName: this.allCards.getCard(CardIds.TableFlip_TOY_883).name,
		});
	}
}
