/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { getControllerEntity, getEntityTag } from '../../services/parser-entity-utils';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class OverloadThisGameCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'overloadThisGame';
	public override image = CardIds.HaywireHornswog_END_030;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.HaywireHornswog_END_030,
		// Snowfury Giant: Costs (1) less for each Mana Crystal you've Overloaded this game.
		CardIds.SnowfuryGiant_ICC_090,
		CardIds.SnowfuryGiant_CORE_ICC_090,
	];

	readonly player = {
		pref: 'playerOverloadThisGameCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			const controllerEntity = getControllerEntity(state.parserState?.CurrentEntities, state.parserState?.ControllerEntityMap, state.localPlayerId!);
			return getEntityTag(controllerEntity, GameTag.OVERLOAD_THIS_GAME, 0);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.overload-this-game-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.overload-this-game-tooltip'),
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
		return this.i18n.translateString(`counters.overload-this-game.${side}`, {
			value: value,
		});
	}
}
