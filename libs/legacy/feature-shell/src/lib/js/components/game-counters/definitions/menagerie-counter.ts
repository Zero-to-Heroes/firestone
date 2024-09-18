import { CardIds, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { GameState, ShortCard } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable, distinctUntilChanged, map } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class MenagerieCounterDefinition implements CounterDefinition<GameState, readonly ShortCard[]> {
	prefValue$?: Observable<boolean> = new Observable<boolean>();

	readonly type = 'menagerie';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly cardTooltips?: readonly string[];
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
	): Promise<MenagerieCounterDefinition> {
		await prefs.isReady();
		const result = new MenagerieCounterDefinition(side, allCards, i18n);
		result.prefValue$ = prefs.preferences$$.pipe(
			map((prefs) => prefs.countersUseExpandedView),
			distinctUntilChanged(),
		);
		return result;
	}

	public select(gameState: GameState): readonly ShortCard[] {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.cardsPlayedThisMatch ?? [];
	}

	public emit(
		cardsPlayedThisMatch: readonly ShortCard[],
		countersUseExpandedView: boolean,
	): NonFunctionProperties<MenagerieCounterDefinition> {
		const allPlayedCards = cardsPlayedThisMatch.map((c) => this.allCards.getCard(c.cardId));
		console.debug('allPlayedCards', allPlayedCards, cardsPlayedThisMatch);

		const uniqueTribes = extractUniqueTribes(allPlayedCards)
			.map((tribe) => this.i18n.translateString(`global.tribe.${Race[tribe].toLowerCase()}`))
			.sort();
		const tribeText = countersUseExpandedView ? '<br/>' + uniqueTribes?.join('<br/>') : uniqueTribes.join(', ');
		const tooltip = this.i18n.translateString(`counters.menagerie.${this.side}`, {
			value: tribeText,
		});
		return {
			type: 'menagerie',
			value: uniqueTribes.length,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.TheOneAmalgamBand}.jpg`,
			cssClass: 'menagerie-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}

export const extractUniqueTribes = (allPlayedCards: readonly ReferenceCard[]) => {
	const minionsPlayedWithTribes = allPlayedCards.filter((c) => c.type === 'Minion').filter((c) => !!c.races?.length);
	const minionsToProcess: Mutable<ReferenceCard & { picked?: boolean }>[] = [
		...minionsPlayedWithTribes
			.filter((c) => !c.races.includes(Race[Race.ALL]))
			.map((c) => ({ ...c, races: [...c.races] })),
	];

	const uniqueTribes: Race[] = [];
	const maxTribesPerMinion = 2;
	for (let i = 1; i <= maxTribesPerMinion; i++) {
		let dirty = true;
		while (dirty) {
			dirty = false;
			for (let j = 0; j < minionsToProcess.length; j++) {
				const minion = minionsToProcess[j];
				if (!minion.picked && minion.races.length > 0 && minion.races.length <= i) {
					const raceToAdd = minion.races[0];
					uniqueTribes.push(Race[raceToAdd]);
					// console.debug('added', raceToAdd, uniqueTribes);
					for (const m of minionsToProcess) {
						m.races = m.races.filter((r) => r !== raceToAdd);
						// console.debug('updates races', m.name, m.races, raceToAdd);
					}
					minion.picked = true;
					dirty = true;
					// Restart the loop, so we're not dependant on the order in which we process things
					j = 0;
				}
			}
			// minionsToProcess = minionsToProcess.filter((c) => !c.picked);
		}
	}

	uniqueTribes.push(
		...minionsPlayedWithTribes
			.filter((m) => m.races.includes(Race[Race.ALL]))
			.flatMap((m) => m.races)
			.map((r: string) => Race[r]),
	);
	return uniqueTribes;
};

type Mutable<T> = {
	-readonly [key in keyof T]: T[key];
};
