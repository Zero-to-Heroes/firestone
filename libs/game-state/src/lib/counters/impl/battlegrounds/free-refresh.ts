import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
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
			console.debug('player enchants', state.playerDeck.enchantments);
			return (
				state.playerDeck.enchantments
					?.filter((e) => e.cardId === CardIds.RefreshingAnomaly_RefreshCosts0Enchantment)
					?.map((e) => e.tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_2)?.Value ?? 0)
					.reduce((a, b) => a + b, 0) || null
			);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-free-refresh-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-free-refresh-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService) {
		super();
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
