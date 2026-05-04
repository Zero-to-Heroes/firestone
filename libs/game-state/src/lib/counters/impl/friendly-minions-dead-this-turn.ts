import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class FriendlyMinionsDeadThisTurnCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'friendlyDeadMinionsThisTurn';
	public override image = CardIds.FeastOfSouls;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		// Feast of Souls: Draw a card for each friendly minion that died this turn.
		CardIds.FeastOfSouls,
		CardIds.FeastOfSoulsCore,
	];

	readonly player = {
		pref: 'playerFriendlyDeadMinionsThisTurnCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number => state.playerDeck.minionsDeadThisTurn?.length ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.friendly-dead-minions-this-turn-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.friendly-dead-minions-this-turn-tooltip'),
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
		return this.i18n.translateString(`counters.friendly-dead-minions-this-turn.${side}`, { value: value });
	}
}
