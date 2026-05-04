import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class DamageTakenThisTurnCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'damageTakenThisTurn';
	public override image = CardIds.NethersoulBuster;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	// Nethersoul Buster: Battlecry: Gain +1 Attack for each damage your hero has taken this turn.
	public override cards: readonly CardIds[] = [CardIds.NethersoulBuster];

	readonly player = {
		pref: 'playerDamageTakenThisTurnCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number => state.playerDeck.damageTakenThisTurn ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.damage-taken-this-turn-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.damage-taken-this-turn-tooltip'),
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
		return this.i18n.translateString(`counters.damage-taken-this-turn.${side}`, { value: value });
	}
}
