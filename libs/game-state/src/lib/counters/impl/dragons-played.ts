import { CardIds, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class DragonsPlayedCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'dragonsPlayed';
	public override image = CardIds.TimewinderZarimi_TOY_385;
	public override cards: readonly CardIds[] = [CardIds.Kazakusan_ONY_005, CardIds.TimewinderZarimi_TOY_385];

	readonly opponent = undefined;
	readonly player = {
		pref: 'playerDragonsPlayedCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck?.cardsPlayedThisMatch
				.map((c) => this.allCards.getCard(c.cardId))
				.filter((c) => hasCorrectTribe(c, Race.DRAGON)).length,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dragons-played-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dragons-played-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.specific-plays.${side}`, {
			value: side === 'player' ? this.player.value(gameState) : null,
			cardName: this.i18n.translateString('global.tribe.dragon'),
		});
	}
}
