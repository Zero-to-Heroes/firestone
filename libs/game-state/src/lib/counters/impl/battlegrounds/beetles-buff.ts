import { CardIds } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

export class BeetlesBuffCounterDefinitionV2 extends CounterDefinitionV2<string> {
	public override id: CounterType = 'beetlesBuff';
	public override image = CardIds.BoonOfBeetles_BeetleToken_BG28_603t;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsBeetleCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) =>
			!!bgState?.currentGame.beetlesAttackBuff || !!bgState?.currentGame.beetlesHealthBuff
				? `${bgState.currentGame.beetlesAttackBuff ?? 0}/${bgState.currentGame.beetlesHealthBuff ?? 0}`
				: null,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-beetle-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-beetle-tooltip'),
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
		return this.i18n.translateString(`counters.bgs-beetles.${side}`, {
			cardName: allCards.getCard(CardIds.BoonOfBeetles_BeetleToken_BG28_603t)?.name,
			atk: atk,
			health: health,
		});
	}
}
