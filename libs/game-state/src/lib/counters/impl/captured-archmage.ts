/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class CapturedArchmageCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'capturedArchmage';
	public override image = CardIds.CapturedArchmage_JAIL_974;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerCapturedArchmageCounter' as const,
		display: (state: GameState): boolean =>
			state.playerDeck.minionsDeadThisMatch.some((c) => c.cardId === CardIds.CapturedArchmage_JAIL_974),
		value: (state: GameState) =>
			state.playerDeck.minionsDeadThisMatch.filter((c) => c.cardId === CardIds.CapturedArchmage_JAIL_974).length,
		setting: {
			label: (i18n: ILocalizationService): string =>
				this.allCards.getCard(CardIds.CapturedArchmage_JAIL_974)?.name,
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.card-dead-tooltip', {
					cardName: this.allCards.getCard(CardIds.CapturedArchmage_JAIL_974)?.name,
				}),
		},
	};
	readonly opponent = {
		pref: 'opponentCapturedArchmageCounter' as const,
		display: (state: GameState): boolean =>
			state.opponentDeck.minionsDeadThisMatch.some((c) => c.cardId === CardIds.CapturedArchmage_JAIL_974),
		value: (state: GameState) =>
			state.opponentDeck.minionsDeadThisMatch.filter((c) => c.cardId === CardIds.CapturedArchmage_JAIL_974)
				.length,

		setting: {
			label: (i18n: ILocalizationService): string =>
				this.allCards.getCard(CardIds.CapturedArchmage_JAIL_974)?.name,
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.specific-deaths', {
					cardName: this.allCards.getCard(CardIds.CapturedArchmage_JAIL_974)?.name,
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
		return this.i18n.translateString(`counters.specific-deaths.${side}`, {
			value: this[side]?.value(gameState) ?? 0,
			cardName: this.allCards.getCard(CardIds.CapturedArchmage_JAIL_974)?.name,
		});
	}
}
