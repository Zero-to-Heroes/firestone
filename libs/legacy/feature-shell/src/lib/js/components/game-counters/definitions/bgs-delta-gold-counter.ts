import { CardIds, Race } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { GameState } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { NonFunctionProperties, groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable, distinctUntilChanged, map } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

const GOLD_DELTA_VALUES: { [cardId: string]: number } = {
	[CardIds.Overconfidence_BG28_884]: 3, // Or 1 for ties?
	[CardIds.SouthseaBusker_BG26_135]: 1,
	[CardIds.SouthseaBusker_BG26_135_G]: 2,
	[CardIds.CarefulInvestment_BG28_800]: 2,
	[CardIds.RecklessInvestment_BG28_513]: -2,
};
export const CARD_IDS_FOR_GOLD_DELTA = Object.keys(GOLD_DELTA_VALUES) as CardIds[];

export class BgsGoldDeltaCounterDefinition
	implements
		CounterDefinition<
			{ deckState: GameState; bgState: BattlegroundsState },
			{
				extraGold: number;
				overconfidences: number;
				boardAndEnchantments: readonly { cardId: string; gold: number }[];
				cardsPlayedThisTurn: readonly string[];
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
		extraGold: number;
		overconfidences: number;
		boardAndEnchantments: readonly { cardId: string; gold: number }[];
		cardsPlayedThisTurn: readonly string[];
	} {
		return {
			extraGold: input.bgState.currentGame.extraGoldNextTurn,
			overconfidences: input.bgState.currentGame.overconfidences,
			boardAndEnchantments:
				input.bgState.currentGame.boardAndEnchantments
					?.map((cardId) => ({
						cardId: this.allCards.getCard(cardId)?.id,
						gold: getGoldFromCardId(cardId, input.deckState, this.allCards),
					}))
					.filter((c) => c.gold > 0) ?? [],
			cardsPlayedThisTurn:
				input.deckState.playerDeck.cardsPlayedThisTurn
					?.map((c) => c.cardId)
					.filter((c) => CARD_IDS_FOR_GOLD_DELTA.includes(c as CardIds)) ?? [],
		};
	}

	public filter(state: { deckState: GameState; bgState: BattlegroundsState }): boolean {
		return state.bgState?.currentGame?.phase === 'recruit';
	}

	public emit(
		input: {
			extraGold: number;
			overconfidences: number;
			boardAndEnchantments: readonly { cardId: string; gold: number }[];
			cardsPlayedThisTurn: readonly string[];
		},
		countersUseExpandedView: boolean,
	): NonFunctionProperties<BgsGoldDeltaCounterDefinition> {
		console.debug('emitting bgs gold delta counter', input);
		const allCards = [...input.cardsPlayedThisTurn, ...input.boardAndEnchantments.map((c) => c.cardId)];
		const groupedByCard = groupByFunction((cardId: string) => cardId)(allCards);
		const cardsStrArray = Object.keys(groupedByCard).map((cardId) => {
			const cardName = this.allCards.getCard(cardId)?.name;
			const count = groupedByCard[cardId].length;
			return this.i18n.translateString('counters.bgs-gold-delta.card', { cardName, count });
		});
		const cardsStr = countersUseExpandedView ? '<br/>' + cardsStrArray.join('<br/>') : cardsStrArray.join(', ');

		// const groupedByCardOnBoard = groupByFunction((card: { cardId: string; gold: number }) => card.cardId)(
		// 	input.boardAndEnchantments,
		// );
		// const cardsStrArrayOnBoard = Object.keys(groupedByCardOnBoard).map((cardId) => {
		// 	const cardName = this.allCards.getCard(cardId)?.name;
		// 	const count = groupedByCardOnBoard[cardId].length;
		// 	return this.i18n.translateString('counters.bgs-gold-delta.card', { cardName, count });
		// });
		// const cardsStrOnBoard = countersUseExpandedView
		// 	? '<br/>' + cardsStrArrayOnBoard.join('<br/>') + '<br/>'
		// 	: cardsStrArrayOnBoard.join(', ') + '<br/>';

		const goldFromBoard = input.boardAndEnchantments.reduce((a, b) => a + b.gold, 0);
		const goldDelta: number = input.extraGold + goldFromBoard + 3 * input.overconfidences;
		const goldDeltaSure: number = input.extraGold + goldFromBoard;
		const goldDeltaStr = goldDelta === goldDeltaSure ? '' : ` (${goldDelta})`;
		const maxValueText =
			goldDelta === goldDeltaSure
				? ''
				: ` (${this.i18n.translateString('counters.bgs-gold-delta.up-to', {
						maxValue: goldDelta,
				  })})`;
		console.debug('gold delta', goldDelta, goldDeltaSure, goldDelta === goldDeltaSure, maxValueText);

		// const cardBuffs = [...(cardsStrArray ?? []), ...(cardsStrArrayOnBoard ?? [])];
		// const cardsPlayedText =
		// 	cardsStrArray.length > 0
		// 		? this.i18n.translateString('counters.bgs-gold-delta.cards-played', { cards: cardsStr })
		// 		: '';
		// const cardsOnBoardText =
		// 	cardsStrArrayOnBoard.length > 0
		// 		? this.i18n.translateString('counters.bgs-gold-delta.cards-on-board', { cardsOnBoard: cardsStrOnBoard })
		// 		: '';
		// const andText =
		// 	cardsStrArray.length > 0 && cardsStrArrayOnBoard.length > 0
		// 		? '<br/>' + this.i18n.translateString('counters.bgs-gold-delta.and')
		// 		: '';
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

export const getGoldFromCardId = (id: string | number, gameState: GameState, allCards: CardsFacadeService): number => {
	const cardId = allCards.getCard(id)?.id;
	switch (cardId) {
		case CardIds.AccordOTron_BG26_147:
		case CardIds.AccordOTron_AccordOTronEnchantment_BG26_147e:
			return 1;
		case CardIds.AccordOTron_BG26_147_G:
		case CardIds.AccordOTron_AccordOTronEnchantment_BG26_147_Ge:
			return 2;
		case CardIds.RecordSmuggler_BG26_812:
		case CardIds.RecordSmuggler_BG26_812_G:
			const smugglerMultiplier = cardId === CardIds.RecordSmuggler_BG26_812 ? 1 : 2;
			const extraGold =
				gameState?.playerDeck.board.filter((e) => allCards.getCard(e.cardId).races?.includes(Race[Race.PIRATE]))
					.length >= 3
					? 2
					: 0;
			return smugglerMultiplier * (2 + extraGold);
		default:
			return 0;
	}
};
