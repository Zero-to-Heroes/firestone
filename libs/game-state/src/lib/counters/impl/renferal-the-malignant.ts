/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class RenferalTheMalignantCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'renferalTheMalignant';
	public override image = CardIds.RenferalTheMalignant_EDR_526;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.RenferalTheMalignant_EDR_526];

	readonly player = {
		pref: 'playerRenferalTheMalignantCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return (
				state.playerDeck.cardsPlayedThisMatch.filter((c) => c.cardId === CardIds.RenferalTheMalignant_EDR_526)
					.length ?? 0
			);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				this.allCards.getCard(CardIds.RenferalTheMalignant_EDR_526).name,
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.card-name-played-tooltip', {
					cardName: this.allCards.getCard(CardIds.RenferalTheMalignant_EDR_526).name,
				}),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.card-name-played.${side}`, {
			value: value,
			cardName: this.allCards.getCard(CardIds.RenferalTheMalignant_EDR_526).name,
		});
	}
}
