import { CardIds } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

export class BgsBloodGemCounterDefinitionV2 extends CounterDefinitionV2<{ attack: number; health: number }> {
	public override id: CounterType = 'bgsBloodGem';
	public override image = CardIds.BloodGem;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsBloodGemCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			const atk = bgState?.currentGame?.bloodGemAttackBuff ?? 0;
			const health = bgState?.currentGame?.bloodGemHealthBuff ?? 0;
			if (atk === 0 && health === 0) {
				return null;
			}
			return {
				attack: 1 + atk,
				health: 1 + health,
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-blood-gem-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-blood-gem-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override formatValue(
		value: { attack: number; health: number } | null | undefined,
	): null | undefined | number | string {
		return value ? `+${value.attack}/+${value.health}` : null;
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
	): string {
		const value = this[side]?.value(gameState, bgState) ?? { attack: 1, health: 1 };
		return this.i18n.translateString(`counters.bgs-blood-gem.${side}`, {
			cardName: this.allCards.getCard(CardIds.BloodGem).name,
			attack: value.attack,
			health: value.health,
		});
	}
}
