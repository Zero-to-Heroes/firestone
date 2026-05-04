/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/_barrel';
import { GameState } from '../../../models/game-state';
import { getControllerEntity, getEntityTag } from '../../../services/parser-entity-utils';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../counter-type';

export class MrrgltonPlayedCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'bgsMrrgltonPlayed';
	public override image = CardIds.MamaMrrglton_BG35_140;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsMrrgltonPlayedCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			const controllerEntity = getControllerEntity(
				state.parserState?.CurrentEntities,
				state.parserState?.ControllerEntityMap,
				state.localPlayerId!,
			);
			const tagValue = getEntityTag(controllerEntity, GameTag.BACON_MRRGLTON_PLAYED_THIS_GAME);
			return tagValue >= 0 ? tagValue : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-mrrglton-played-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-mrrglton-played-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
	): string {
		const value = this.player.value(gameState, bgState)!;

		return this.i18n.translateString(`counters.mrrglton-played.${side}`, {
			value: value,
		});
	}
}
