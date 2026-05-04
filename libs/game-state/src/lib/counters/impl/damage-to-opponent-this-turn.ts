import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class DamageToOpponentThisTurnCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'damageToOpponentThisTurn';
	public override image = CardIds.FrenziedFelwing;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.FrenziedFelwing];

	readonly player = {
		pref: 'playerDamageToOpponentThisTurnCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number => state.opponentDeck.damageTakenThisTurn ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.damage-to-opponent-this-turn-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.damage-to-opponent-this-turn-tooltip'),
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
		return this.i18n.translateString(`counters.damage-to-opponent-this-turn.${side}`, { value: value });
	}
}
