/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/_barrel';
import { GameState } from '../../../models/game-state';
import { getControllerEntity, getEntityTag } from '../../../services/parser-entity-utils';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../counter-type';

export class TastyLobsterBuffCounterDefinitionV2 extends CounterDefinitionV2<{ atk: number; health: number }> {
	public override id: CounterType = 'bgsTastyLobsterBuff';
	public override image = CardIds.TastyLobster_BG36_202;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsTastyLobsterBuffCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			const controllerEntity = getControllerEntity(
				state.parserState?.CurrentEntities,
				state.parserState?.ControllerEntityMap,
				state.localPlayerId!,
			);
			const tagValue = getEntityTag(controllerEntity, GameTag.BACON_TASTY_LOBSTER_BUFF, 0);
			if (tagValue === 0) {
				return null;
			}
			const buff = tagValue + 1;
			return {
				atk: buff,
				health: buff,
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-tasty-lobster-buff-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-tasty-lobster-buff-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override formatValue(
		value: { atk: number; health: number } | null | undefined,
	): null | undefined | number | string {
		return value ? `+${value.atk}/+${value.health}` : null;
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
	): string {
		const { atk, health } = this.player.value(gameState, bgState)!;
		return this.i18n.translateString(`counters.tasty-lobster-buff.${side}`, {
			atk: atk,
			health: health,
		});
	}
}
