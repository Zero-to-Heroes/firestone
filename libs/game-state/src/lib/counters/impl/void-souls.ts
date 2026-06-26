/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class VoidSoulsCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'voidSoul';
	public override image = CardIds.VoidSoul_JAIL_732;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerVoidSoulCounter' as const,
		display: (state: GameState): boolean =>
			state.playerDeck.powerTriggeredThisMatch.some((c) => c.cardId === CardIds.VoidSoul_JAIL_732),
		value: (state: GameState) =>
			state.playerDeck.powerTriggeredThisMatch.filter((c) => c.cardId === CardIds.VoidSoul_JAIL_732).length,
		setting: {
			label: (i18n: ILocalizationService): string => this.allCards.getCard(CardIds.VoidSoul_JAIL_732)?.name,
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.card-name-played-tooltip', {
					cardName: this.allCards.getCard(CardIds.VoidSoul_JAIL_732)?.name,
				}),
		},
	};
	readonly opponent = {
		pref: 'opponentVoidSoulCounter' as const,
		display: (state: GameState): boolean =>
			state.opponentDeck.powerTriggeredThisMatch.some((c) => c.cardId === CardIds.VoidSoul_JAIL_732),
		value: (state: GameState) =>
			state.opponentDeck.powerTriggeredThisMatch.filter((c) => c.cardId === CardIds.VoidSoul_JAIL_732).length,

		setting: {
			label: (i18n: ILocalizationService): string => this.allCards.getCard(CardIds.VoidSoul_JAIL_732)?.name,
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.card-name-played-tooltip', {
					cardName: this.allCards.getCard(CardIds.VoidSoul_JAIL_732)?.name,
				}),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string | null {
		return this.i18n.translateString(`counters.specific-plays.${side}`, {
			value: this[side]?.value(gameState) ?? 0,
			cardName: this.allCards.getCard(CardIds.VoidSoul_JAIL_732)?.name,
		});
	}
}
