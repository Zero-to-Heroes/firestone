import { CardIds, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class DragonsInHandCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'dragonsInHand';
	public override image = CardIds.FlyOffTheShelves_TOY_714;
	public override cards: readonly CardIds[] = [CardIds.FlyOffTheShelves_TOY_714];

	readonly opponent = undefined;
	readonly player = {
		pref: 'playerDragonsInHandCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck?.hand
				.map((c) => this.allCards.getCard(c.cardId))
				.filter((c) => hasCorrectTribe(c, Race.DRAGON)).length,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dragons-in-hand-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dragons-in-hand-tooltip', {
					cardName: this.allCards.getCard(this.image).name,
				}),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.specific-cards-in-hand.${side}`, {
			value: this[side]?.value(gameState),
			cardName: this.i18n.translateString('global.tribe.dragon'),
		});
	}
}
