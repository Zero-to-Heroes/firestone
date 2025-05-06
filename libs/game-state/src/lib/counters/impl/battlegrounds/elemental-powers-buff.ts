/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

export class ElementalPowersBuffCounterDefinitionV2 extends CounterDefinitionV2<{ atk: number; health: number }> {
	public override id: CounterType = 'elementalPowersBuff';
	public override image = CardIds.SandSwirler_BG32_841;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsElementalPowersBuffCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			const value = {
				atk:
					state.fullGameState?.Player.PlayerEntity.tags.find(
						(t) => t.Name === GameTag.BACON_ELEMENTAL_BUFFATKVALUE,
					)?.Value ?? 0,
				health:
					state.fullGameState?.Player.PlayerEntity.tags.find(
						(t) => t.Name === GameTag.BACON_ELEMENTAL_BUFFHEALTHVALUE,
					)?.Value ?? 0,
			};
			if (value.atk === 0 && value.health === 0) {
				return null;
			}
			return value;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-elemental-buff-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-elemental-buff-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override formatValue(
		value: { atk: number; health: number } | null | undefined,
	): null | undefined | number | string {
		return value ? `+${value.atk} / +${value.health}` : null;
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
	): string {
		const { atk, health } = this.player.value(gameState, bgState)!;
		return this.i18n.translateString(`counters.elemental-buff.${side}`, {
			atk: atk,
			health: health,
		});
	}
}
