/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class YsondreCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'ysondre';
	public override image = CardIds.Ysondre_EDR_465;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.Ysondre_EDR_465];

	readonly player = {
		pref: 'playerYsondreCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return (
				state.playerDeck.minionsDeadThisMatch.filter((entity) => entity.cardId === CardIds.Ysondre_EDR_465)
					.length +
				state.opponentDeck.minionsDeadThisMatch.filter((entity) => entity.cardId === CardIds.Ysondre_EDR_465)
					.length
			);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.ysondrelabel'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.ysondre-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.ysondre.${side}`, { value: value });
	}
}
