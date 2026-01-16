/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class MinionsDeadThisTurnCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'deadMinionsThisTurn';
	public override image = CardIds.RemnantOfRage_END_004;
	public override cards: readonly CardIds[] = [
		CardIds.RemnantOfRage_END_004,
		CardIds.VolcanicDrake_BRM_025,
		CardIds.VolcanicLumberer,
		CardIds.SolemnVigil,
		CardIds.WickedSkeleton_ICC_904,
		CardIds.WickedSkeleton_CORE_ICC_904,
	];

	readonly player = {
		pref: 'playerDeadMinionsThisTurnCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck.minionsDeadThisTurn.length + state.opponentDeck.minionsDeadThisTurn.length,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dead-minions-this-turn-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dead-minions-this-turn-tooltip'),
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
		const deadMinions = this[side]?.value(gameState);
		const tooltip = this.i18n.translateString(`counters.dead-minions-this-turn.${side}`, {
			value: deadMinions,
		});
		return tooltip;
	}
}
