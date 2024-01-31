import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { NonFunctionProperties, groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable, distinctUntilChanged, map } from 'rxjs';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
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
	implements CounterDefinition<{ deckState: GameState; bgState: BattlegroundsState }, readonly string[], boolean>
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

	public select(input: { deckState: GameState; bgState: BattlegroundsState }): readonly string[] {
		return (
			input.deckState.playerDeck.cardsPlayedThisTurn
				?.map((c) => c.cardId)
				.filter((c) => CARD_IDS_FOR_GOLD_DELTA.includes(c as CardIds)) ?? []
		);
	}

	public emit(
		cardsPlayedThisTurn: readonly string[],
		countersUseExpandedView: boolean,
	): NonFunctionProperties<BgsGoldDeltaCounterDefinition> {
		const groupedByCard = groupByFunction((cardId: string) => cardId)(cardsPlayedThisTurn);
		const cardsStrArray = Object.keys(groupedByCard).map((cardId) => {
			const cardName = this.allCards.getCard(cardId)?.name;
			const count = groupedByCard[cardId].length;
			return this.i18n.translateString('counters.bgs-gold-delta.card', { cardName, count });
		});
		const cardsStr = countersUseExpandedView ? '<br/>' + cardsStrArray.join('<br/>') : cardsStrArray.join(', ');
		const goldDelta: number = cardsPlayedThisTurn
			.map((cardId) => GOLD_DELTA_VALUES[cardId as CardIds])
			.reduce((a, b) => a + b, 0);
		const goldDeltaSure: number = cardsPlayedThisTurn
			.filter((cardId) => cardId !== CardIds.Overconfidence_BG28_884)
			.map((cardId) => GOLD_DELTA_VALUES[cardId as CardIds])
			.reduce((a, b) => a + b, 0);
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
