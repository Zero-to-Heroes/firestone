import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/_barrel';
import { GameState } from '../../../models/game-state';
import { getControllerEntity, getEnchantmentsForEntity, getEntityTag } from '../../../services/parser-entity-utils';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

export class FreeRefreshCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'freeRefresh';
	public override image = CardIds.RefreshingAnomaly_BGS_116;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsFreeRefreshCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			const controllerEntity = getControllerEntity(state.parserState?.CurrentEntities, state.parserState?.ControllerEntityMap, state.localPlayerId!);
			if (!controllerEntity) return null;
			const enchantments = getEnchantmentsForEntity(state.parserState?.CurrentEntities, controllerEntity.Id);
			const refreshEnch = enchantments.find(
				(e) =>
					e.CardId ===
					CardIds.Bacon_free_refresh_player_enchDntEnchantment_Bacon_Free_Refresh_Player_Ench,
			);
			const result = refreshEnch ? getEntityTag(refreshEnch, GameTag.BACON_FREE_REFRESH_COUNT, 0) : 0;
			return result > 0 ? result : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-free-refresh-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-free-refresh-tooltip'),
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
		return this.i18n.translateString(`counters.bgs-free-refresh.${side}`, {
			value: this.player.value(gameState, bgState),
		});
	}
}
