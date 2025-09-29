import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class OutcastCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'outcast';
	public override image = CardIds.VengefulWalloper;
	public override cards: readonly CardIds[] = [CardIds.VengefulWalloper];

	readonly player = {
		pref: 'playerOutcastCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null =>
			state.playerDeck?.cardsPlayedThisMatch?.filter((s) =>
				this.allCards.getCard(s.cardId).mechanics?.includes(GameTag[GameTag.OUTCAST]),
			)?.length ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.outcast-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.outcast-tooltip', {
					cardName: allCards.getCard(CardIds.VengefulWalloper).name,
				}),
		},
	};

	readonly opponent = undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.outcast.${side}`, {
			value: this[side]?.value(gameState) ?? 0,
		});
	}
}
