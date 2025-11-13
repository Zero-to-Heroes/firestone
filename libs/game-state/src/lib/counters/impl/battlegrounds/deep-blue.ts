/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/_barrel';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

const BUFF_THRESHOLD = 4;

export class DeepBlueCounterDefinitionV2 extends CounterDefinitionV2<{ atk: number; health: number }> {
	public override id: CounterType = 'bgsDeepBlue';
	public override image = CardIds.DeepBlueCrooner_DeepBluesToken_BG26_502t;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsDeepBlueCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			const enchant = state.playerDeck.enchantments.filter(
				(e) => e.cardId === CardIds.DeepBlueCroonerPlayerEnchantDntEnchantment,
			);
			if (!enchant) {
				return null;
			}

			const numberOfPlayed = enchant
				.flatMap((e) => e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0)
				.reduce((a, b) => a + b, 0);
			const refEnchant = this.allCards.getCard(CardIds.DeepBlueCrooner_DeepBluesToken_BG26_502t);
			return {
				atk: refEnchant?.tags?.[GameTag[GameTag.TAG_SCRIPT_DATA_NUM_1]] * numberOfPlayed,
				health: refEnchant?.tags?.[GameTag[GameTag.TAG_SCRIPT_DATA_NUM_2]] * numberOfPlayed,
			};
			// return !bgState?.currentGame?.availableRaces?.includes(Race.NAGA) ? null : { atk: 0, health: 0 };
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-deep-blue'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-deep-blue-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super();
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
		const value = this.player.value(gameState, bgState)!;

		return this.i18n.translateString(`counters.deep-blue.${side}`, {
			atk: value.atk,
			health: value.health,
			cardName: allCards.getCard(CardIds.DeepBlueCrooner_DeepBluesToken_BG26_502t)?.name,
		});
	}
}
