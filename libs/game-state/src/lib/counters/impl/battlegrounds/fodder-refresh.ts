import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/_barrel';
import { GameState } from '../../../models/game-state';
import { getControllerEntity, getEnchantmentsForEntity, getEntityTag } from '../../../services/parser-entity-utils';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../counter-type';

export class FodderRefreshCounterDefinitionV2 extends CounterDefinitionV2<{
	num1: number;
	num2: number;
	num3: number;
}> {
	public override id: CounterType = 'fodderRefresh';
	public override image = CardIds.LaboratoryAssistant_DemonFodderToken_BG35_150t;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsFodderRefreshCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			const controllerEntity = getControllerEntity(
				state.parserState?.CurrentEntities,
				state.parserState?.ControllerEntityMap,
				state.localPlayerId!,
			);
			if (!controllerEntity) return null;
			const enchantments = getEnchantmentsForEntity(state.parserState?.CurrentEntities, controllerEntity.Id);
			const refreshEnch = enchantments.find(
				(e) => e.CardId === CardIds.FodderPlayerEnchantDntEnchantment_BG35_150pe,
			);
			const result = refreshEnch
				? {
						num1: getEntityTag(refreshEnch, GameTag.TAG_SCRIPT_DATA_NUM_1, 0),
						num2: getEntityTag(refreshEnch, GameTag.TAG_SCRIPT_DATA_NUM_2, 0),
						num3: getEntityTag(refreshEnch, GameTag.TAG_SCRIPT_DATA_NUM_3, 0),
					}
				: null;
			return result && result.num1 + result.num2 + result.num3 > 0 ? result : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-fodder-refresh-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-fodder-refresh-tooltip'),
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
		value: { num1: number; num2: number; num3: number } | null | undefined,
	): null | undefined | number | string {
		if (!value) {
			return null;
		}
		return `${value.num1 ?? 0}/${value.num2 ?? 0}/${value.num3 ?? 0}`;
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
	): string {
		return this.i18n.translateString(`counters.bgs-fodder-refresh.${side}`);
	}
}
