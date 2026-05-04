import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class FreebirdCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'freebird';
	public override image = CardIds.Freebird;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	// Freebird: Charge. Battlecry: Gain +1/+1 for each other Freebird you've played this game.
	public override cards: readonly CardIds[] = [CardIds.Freebird];

	readonly player = {
		pref: 'playerFreebirdCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck.cardsPlayedThisMatch?.filter((c) => c.cardId === CardIds.Freebird)?.length ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.freebird-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.freebird-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.freebird.${side}`, { value: value });
	}
}
