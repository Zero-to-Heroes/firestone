import { CardIds } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

export class BallerBuffCounterDefinitionV2 extends CounterDefinitionV2<string> {
	public override id: CounterType = 'ballerBuff';
	public override image = CardIds.FireBaller_BG31_816;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsBallerCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) =>
			!!bgState?.currentGame.ballerAttackBuff || !!bgState?.currentGame.ballerHealthBuff
				? `${bgState.currentGame.ballerAttackBuff ?? 0}/${bgState.currentGame.ballerHealthBuff ?? 0}`
				: null,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-baller-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-baller-tooltip'),
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
		const [atk, health] = this.player.value(gameState, bgState)?.split('/') ?? [];
		return this.i18n.translateString(`counters.bgs-baller.${side}`, {
			atk: atk,
			health: health,
		});
	}
}
