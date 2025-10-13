import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class DiveTheGolakkaDepthsCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'diveTheGolakkaDepths';
	public override image = CardIds.DiveTheGolakkaDepths_TLC_426;
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerDiveTheGolakkaDepthsCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null => {
			const quest = state?.playerDeck
				?.getAllCardsInDeckWithoutOptions()
				.find((c) => c.cardId === CardIds.DiveTheGolakkaDepths_TLC_426 && c.zone === 'SECRET');
			return quest?.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] || null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dive-the-golakka-depths-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dive-the-golakka-depths-tooltip', {
					cardName: allCards.getCard(CardIds.DiveTheGolakkaDepths_TLC_426).name,
				}),
		},
	};

	readonly opponent = {
		pref: 'opponentDiveTheGolakkaDepthsCounter' as const,
		display: (state: GameState): boolean => {
			return true;
		},
		value: (state: GameState): number | null => {
			const quest = state?.opponentDeck
				?.getAllCardsInDeckWithoutOptions()
				.find((c) => c.cardId === CardIds.DiveTheGolakkaDepths_TLC_426 && c.zone === 'SECRET');
			return quest?.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] || null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dive-the-golakka-depths-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dive-the-golakka-depths-tooltip', {
					cardName: allCards.getCard(CardIds.DiveTheGolakkaDepths_TLC_426).name,
				}),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.dive-the-golakka-depths.${side}`, {
			value: this[side]?.value(gameState) ?? 0,
			cardName: this.allCards.getCard(CardIds.DiveTheGolakkaDepths_TLC_426).name,
		});
	}
}
