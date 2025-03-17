/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class LightrayCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'lightray';
	public override image = CardIds.Lightray;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.Lightray];

	readonly player = {
		pref: 'playerLightrayCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return (
				state.playerDeck.cardsPlayedThisMatch
					.map((c) => this.allCards.getCard(c.cardId))
					.filter((c) => c?.classes?.includes(CardClass[CardClass.PALADIN])).length ?? 0
			);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.lightray-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.lightray-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.lightray.${side}`, {
			value: value,
			lightray: Math.max(0, this.allCards.getCard(CardIds.Lightray).cost! - value),
		});
	}
}
