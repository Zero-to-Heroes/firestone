import { CardIds, GameTag, Race } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { DeckState, GameState, TagGameState } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { NonFunctionProperties, groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable, distinctUntilChanged, map } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

const GOLD_DELTA_PLAYER_ENCHANTMENTS = [
	CardIds.SouthseaBusker_ExtraGoldNextTurnDntEnchantment,
	CardIds.Overconfidence_OverconfidentDntEnchantment_BG28_884e,
	CardIds.GraceFarsail_ExtraGoldIn2TurnsDntEnchantment_BG31_825e2,
];
// const GOLD_DELTA_VALUES: { [cardId: string]: number } = {
// 	[CardIds.Overconfidence_BG28_884]: 3, // Or 1 for ties?
// 	// [CardIds.SouthseaBusker_BG26_135]: 1,
// 	// [CardIds.SouthseaBusker_BG26_135_G]: 2,
// 	[CardIds.CarefulInvestment_BG28_800]: 2,
// 	[CardIds.RecklessInvestment_BG28_513]: -2,
// 	// [CardIds.GraceFarsail_BG31_825]: 2,
// 	// [CardIds.GraceFarsail_BG31_825_G]: 4,
// };
// export const CARD_IDS_FOR_GOLD_DELTA = Object.keys(GOLD_DELTA_VALUES) as CardIds[];

export class BgsGoldDeltaCounterDefinition
	implements
		CounterDefinition<
			{ deckState: GameState; bgState: BattlegroundsState },
			{
				overconfidences: number;
				enchantments: readonly { cardId: string; gold: number }[];
			},
			boolean
		>
{
	prefValue$?: Observable<boolean> = new Observable<boolean>();

	readonly type = 'bgsGoldDelta';
	readonly value: string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static async create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
		prefs: PreferencesService,
	): Promise<BgsGoldDeltaCounterDefinition> {
		await prefs.isReady();
		const result = new BgsGoldDeltaCounterDefinition(side, allCards, i18n);
		result.prefValue$ = prefs.preferences$$.pipe(
			map((prefs) => prefs.countersUseExpandedView),
			distinctUntilChanged(),
		);
		return result;
	}

	public select(input: { deckState: GameState; bgState: BattlegroundsState }): {
		overconfidences: number;
		enchantments: readonly { cardId: string; gold: number }[];
	} {
		const playerEnchants = input.deckState.playerDeck.enchantments.filter((e) =>
			GOLD_DELTA_PLAYER_ENCHANTMENTS.includes(e.cardId as CardIds),
		);
		const minionEnchants = input.deckState.fullGameState?.Player?.Board?.flatMap((m) => m.enchantments);
		console.debug('[debug] playerEnchants', playerEnchants, 'minionEnchants', minionEnchants, input);
		const playerEnchantGold =
			playerEnchants
				.filter((e) => e.cardId !== CardIds.Overconfidence_BG28_884)
				.map((e) => ({ cardId: e.cardId, gold: getGoldForPlayerEnchant(e) }))
				.filter((e) => e.gold !== 0) ?? [];
		const minionEnchantGold =
			minionEnchants
				?.map((e) => ({
					cardId: e.cardId,
					gold: getGoldForMinion(e, input.deckState.playerDeck, this.allCards),
				}))
				.filter((e) => e.gold !== 0) ?? [];
		const minionsBoardGold =
			input.deckState.playerDeck.board
				?.map((e) => ({
					cardId: e.cardId,
					gold: getGoldForMinion(e, input.deckState.playerDeck, this.allCards),
				}))
				.filter((e) => e.gold !== 0) ?? [];
		const enchants = [...playerEnchantGold, ...minionEnchantGold, ...minionsBoardGold];
		return {
			overconfidences: playerEnchants.filter((e) => e.cardId === CardIds.Overconfidence_BG28_884).length,
			enchantments: enchants,
		};
	}

	public filter(state: { deckState: GameState; bgState: BattlegroundsState }): boolean {
		return state.bgState?.currentGame?.phase === 'recruit';
	}

	public emit(
		input: {
			overconfidences: number;
			enchantments: readonly { cardId: string; gold: number }[];
		},
		countersUseExpandedView: boolean,
	): NonFunctionProperties<BgsGoldDeltaCounterDefinition> {
		console.debug('[debug] considering gold next turn', input);

		const groupedByCard = groupByFunction((e: { cardId: string; gold: number }) => e.cardId)(input.enchantments);
		const cardsStrArray = Object.keys(groupedByCard).map((cardId) => {
			const cardName = this.allCards.getCard(cardId)?.name;
			const count = groupedByCard[cardId].length;
			return this.i18n.translateString('counters.bgs-gold-delta.card', { cardName, count });
		});
		const cardsStr = countersUseExpandedView ? '<br/>' + cardsStrArray.join('<br/>') : cardsStrArray.join(', ');

		const goldDeltaSure: number = input.enchantments.reduce((a, b) => a + b.gold, 0);
		const goldDelta: number = goldDeltaSure + 3 * input.overconfidences;
		const goldDeltaStr = goldDelta === goldDeltaSure ? '' : ` (${goldDelta})`;
		const maxValueText =
			goldDelta === goldDeltaSure
				? ''
				: ` (${this.i18n.translateString('counters.bgs-gold-delta.up-to', {
						maxValue: goldDelta,
				  })})`;
		const tooltip = this.i18n.translateString(`counters.bgs-gold-delta.${this.side}`, {
			value: goldDeltaSure,
			maxValueText: maxValueText,
			cards: cardsStr,
		});
		return {
			type: 'bgsGoldDelta',
			value: `${goldDeltaSure}${goldDeltaStr}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.RecklessInvestment_BG28_513}.jpg`,
			cssClass: 'bgs-gold-delta-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}

const getGoldForPlayerEnchant = (enchantment: { cardId: string; tags?: readonly TagGameState[] }): number => {
	switch (enchantment.cardId) {
		case CardIds.SouthseaBusker_ExtraGoldNextTurnDntEnchantment:
			return enchantment.tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value ?? 0;
		case CardIds.GraceFarsail_ExtraGoldIn2TurnsDntEnchantment_BG31_825e2:
			return enchantment.tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_2)?.Value === 1
				? enchantment.tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value ?? 0
				: 0; // Not next turn
		default:
			return 0;
	}
};

const getGoldForMinion = (
	enchantment: { cardId: string; tags?: readonly TagGameState[] },
	playerDeck: DeckState,
	allCards: CardsFacadeService,
): number => {
	switch (enchantment.cardId) {
		case CardIds.AccordOTron_BG26_147:
		case CardIds.AccordOTron_AccordOTronEnchantment_BG26_147e:
			return 1;
		case CardIds.AccordOTron_BG26_147_G:
		case CardIds.AccordOTron_AccordOTronEnchantment_BG26_147_Ge:
			return 2;
		case CardIds.RecordSmuggler_BG26_812:
		case CardIds.RecordSmuggler_BG26_812_G:
			const smugglerMultiplier = enchantment.cardId === CardIds.RecordSmuggler_BG26_812 ? 1 : 2;
			const extraGold =
				playerDeck.board.filter((e) => allCards.getCard(e.cardId).races?.includes(Race[Race.PIRATE])).length >=
				3
					? 2
					: 0;
			return smugglerMultiplier * (2 + extraGold);
		default:
			return 0;
	}
};
