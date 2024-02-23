import { CardIds } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/common';
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
			{ extraGold: number; overconfidences: number; cardsPlayedThisTurn: readonly string[] },
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
		result.prefValue$ = prefs
			.preferences$((prefs) => prefs.countersUseExpandedView)
			.pipe(
				distinctUntilChanged(),
				map(([pref]) => pref),
			);
		return result;
	}

	public select(input: { deckState: GameState; bgState: BattlegroundsState }): {
		extraGold: number;
		overconfidences: number;
		cardsPlayedThisTurn: readonly string[];
	} {
		return {
			extraGold: input.bgState.currentGame.extraGoldNextTurn,
			overconfidences: input.bgState.currentGame.overconfidences,
			cardsPlayedThisTurn:
				input.deckState.playerDeck.cardsPlayedThisTurn
					?.map((c) => c.cardId)
					.filter((c) => CARD_IDS_FOR_GOLD_DELTA.includes(c as CardIds)) ?? [],
		};
	}

	public emit(
		input: { extraGold: number; overconfidences: number; cardsPlayedThisTurn: readonly string[] },
		countersUseExpandedView: boolean,
	): NonFunctionProperties<BgsGoldDeltaCounterDefinition> {
		const groupedByCard = groupByFunction((cardId: string) => cardId)(input.cardsPlayedThisTurn);
		const cardsStrArray = Object.keys(groupedByCard).map((cardId) => {
			const cardName = this.allCards.getCard(cardId)?.name;
			const count = groupedByCard[cardId].length;
			return this.i18n.translateString('counters.bgs-gold-delta.card', { cardName, count });
		});
		const cardsStr = countersUseExpandedView ? '<br/>' + cardsStrArray.join('<br/>') : cardsStrArray.join(', ');
		const goldDelta: number = input.extraGold + 3 * input.overconfidences;
		const goldDeltaSure: number = input.extraGold;
		const goldDeltaStr = goldDelta === goldDeltaSure ? '' : ` (${goldDelta})`;
		const maxValueText =
			goldDelta === goldDeltaSure
				? ''
				: ` (${this.i18n.translateString('counters.bgs-gold-delta.up-to', {
						maxValue: goldDelta,
				  })})`;
		console.debug('gold delta', goldDelta, goldDeltaSure, goldDelta === goldDeltaSure, maxValueText);
		return {
			type: 'bgsGoldDelta',
			value: `${goldDeltaSure}${goldDeltaStr}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.RecklessInvestment_BG28_513}.jpg`,
			cssClass: 'bgs-gold-delta-counter',
			tooltip: this.i18n.translateString(`counters.bgs-gold-delta.${this.side}`, {
				value: goldDeltaSure,
				maxValueText: maxValueText,
				cards: cardsStr,
			}),
			standardCounter: true,
		};
	}
}
