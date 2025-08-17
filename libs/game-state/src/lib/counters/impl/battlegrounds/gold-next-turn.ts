/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-case-declarations */
/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/_barrel';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

const GOLD_DELTA_PLAYER_ENCHANTMENTS = [
	CardIds.SouthseaBusker_ExtraGoldNextTurnDntEnchantment,
	CardIds.Overconfidence_OverconfidentDntEnchantment_BG28_884e,
	CardIds.GraceFarsail_ExtraGoldIn2TurnsDntEnchantment_BG31_825e2,
];

export class GoldNextTurnCounterDefinitionV2 extends CounterDefinitionV2<{
	overconfidences: number;
	guaranteedGoldNextTurn: number;
}> {
	public override id: CounterType = 'bgsGoldDelta';
	public override image = CardIds.RecklessInvestment_BG28_513;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsGoldDeltaCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => this.buildValue(state),
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-gold-delta-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-gold-delta-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super();
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
		countersUseExpandedView: boolean,
	): string {
		const input = this.player.value(gameState, bgState)!;

		const goldDeltaSure: number = input.guaranteedGoldNextTurn;
		const goldDelta: number = goldDeltaSure + 3 * input.overconfidences;
		const maxValueText =
			goldDelta === goldDeltaSure
				? ''
				: ` (${this.i18n.translateString('counters.bgs-gold-delta.up-to', {
						maxValue: goldDelta,
					})})`;
		const tooltip = this.i18n.translateString(`counters.bgs-gold-delta.${side}`, {
			value: goldDeltaSure,
			maxValueText: maxValueText,
			// cards: cardsStr,
		});

		return tooltip;
	}

	protected override formatValue(
		value:
			| {
					overconfidences: number;
					guaranteedGoldNextTurn: number;
			  }
			| null
			| undefined,
	): null | undefined | number | string {
		if (!value) {
			return null;
		}
		const goldDeltaSure: number = value.guaranteedGoldNextTurn;
		const goldDelta: number = goldDeltaSure + 3 * value.overconfidences;
		const goldDeltaStr = goldDelta === goldDeltaSure ? `${goldDeltaSure}` : `${goldDeltaSure} (${goldDelta})`;
		return goldDeltaStr;
	}

	private buildValue(deckState: GameState): {
		overconfidences: number;
		guaranteedGoldNextTurn: number;
	} | null {
		const guaranteedGoldNextTurn =
			deckState.fullGameState?.Player?.PlayerEntity?.tags?.find(
				(t) => t.Name === GameTag.BACON_PLAYER_EXTRA_GOLD_NEXT_TURN,
			)?.Value ?? 0;
		const overconfidences = deckState.playerDeck.enchantments.filter(
			(e) => e.cardId === CardIds.Overconfidence_OverconfidentDntEnchantment_BG28_884e,
		).length;
		const totalMaybe = guaranteedGoldNextTurn + 3 * overconfidences;
		// console.debug(
		// 	'[gold-next-turn] totalMaybe',
		// 	totalMaybe,
		// 	guaranteedGoldNextTurn,
		// 	overconfidences,
		// 	deckState?.fullGameState?.Player,
		// 	deckState?.playerDeck,
		// );
		if (totalMaybe === 0) {
			return null;
		}

		const result = {
			overconfidences: overconfidences,
			guaranteedGoldNextTurn: guaranteedGoldNextTurn,
		};
		return result;
	}
}

// const getGoldForPlayerEnchant = (enchantment: { cardId: string; tags?: { [Name in GameTag]?: number } }): number => {
// 	switch (enchantment.cardId) {
// 		case CardIds.SouthseaBusker_ExtraGoldNextTurnDntEnchantment:
// 			return enchantment.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0;
// 		case CardIds.GraceFarsail_ExtraGoldIn2TurnsDntEnchantment_BG31_825e2:
// 			return enchantment.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_2] === 1
// 				? (enchantment.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0)
// 				: 0; // Not next turn
// 		default:
// 			return 0;
// 	}
// };

// const getGoldForMinion = (
// 	enchantment: { cardId: string },
// 	playerDeck: DeckState,
// 	allCards: CardsFacadeService,
// ): number => {
// 	switch (enchantment.cardId) {
// 		case CardIds.AccordOTron_BG26_147:
// 		case CardIds.AccordOTron_AccordOTronEnchantment_BG26_147e:
// 			return 1;
// 		case CardIds.AccordOTron_BG26_147_G:
// 		case CardIds.AccordOTron_AccordOTronEnchantment_BG26_147_Ge:
// 			return 2;
// 		case CardIds.RecordSmuggler_BG26_812:
// 		case CardIds.RecordSmuggler_BG26_812_G:
// 			const smugglerMultiplier = enchantment.cardId === CardIds.RecordSmuggler_BG26_812 ? 1 : 2;
// 			const extraGold =
// 				playerDeck.board.filter((e) => allCards.getCard(e.cardId).races?.includes(Race[Race.PIRATE])).length >=
// 				3
// 					? 2
// 					: 0;
// 			return smugglerMultiplier * (2 + extraGold);
// 		default:
// 			return 0;
// 	}
// };

// const getGoldForCard = (cardId: string): number => {
// 	switch (cardId) {
// 		case CardIds.CarefulInvestment_BG28_800:
// 			return 2;
// 		default:
// 			return 0;
// 	}
// };
