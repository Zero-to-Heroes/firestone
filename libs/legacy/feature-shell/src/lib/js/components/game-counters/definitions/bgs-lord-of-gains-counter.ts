import { CardIds, CardType } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/common';
import { GameState } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { NonFunctionProperties, groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable, distinctUntilChanged, map } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BgsLordOfGainsCounterDefinition
	implements CounterDefinition<{ deckState: GameState; bgState: BattlegroundsState }, readonly string[], boolean>
{
	prefValue$?: Observable<boolean> = new Observable<boolean>();

	readonly type = 'bgsLordOfGains';
	readonly value: string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static async create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
		prefs: PreferencesService,
	): Promise<BgsLordOfGainsCounterDefinition> {
		await prefs.isReady();
		const result = new BgsLordOfGainsCounterDefinition(side, allCards, i18n);
		result.prefValue$ = prefs
			.preferences$((prefs) => prefs.countersUseExpandedView)
			.pipe(
				distinctUntilChanged(),
				map(([pref]) => pref),
			);
		return result;
	}

	public select(input: { deckState: GameState; bgState: BattlegroundsState }): readonly string[] {
		return input.deckState.playerDeck.cardsPlayedThisTurn
			?.map((c) => c.cardId)
			?.filter(
				(c) =>
					this.allCards.getCard(c).type?.toUpperCase() === CardType[CardType.SPELL] ||
					this.allCards.getCard(c).type?.toUpperCase() === CardType[CardType.BATTLEGROUND_SPELL],
			);
	}

	public emit(
		spellsPlayedThisTurn: readonly string[],
		countersUseExpandedView: boolean,
	): NonFunctionProperties<BgsLordOfGainsCounterDefinition> {
		const groupedByCard = groupByFunction(
			(cardId: string) =>
				this.allCards.getCard(cardId).battlegroundsNormalDbfId ?? this.allCards.getCard(cardId).dbfId,
		)(spellsPlayedThisTurn);
		const cardsStrArray = Object.keys(groupedByCard)
			.filter((cardId) => ![].includes(cardId))
			.map((cardId) => {
				const cardName = this.allCards.getCard(cardId)?.name;
				return cardName;
			})
			.sort((a, b) => a.localeCompare(b));
		const cardsStr = countersUseExpandedView ? '<br/>' + cardsStrArray.join('<br/>') : cardsStrArray.join(', ');
		const numberOfDifferentSpells = Object.keys(groupedByCard).length;
		return {
			type: 'bgsLordOfGains',
			value: `${numberOfDifferentSpells}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.SlitherspearLordOfGains_BG27_083}.jpg`,
			cssClass: 'bgs-lord-of-gains-counter',
			tooltip: this.i18n.translateString(`counters.bgs-lord-of-gains.${this.side}`, {
				value: numberOfDifferentSpells,
				cards: cardsStr,
			}),
			standardCounter: true,
		};
	}
}
