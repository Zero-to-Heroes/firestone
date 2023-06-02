import { CardIds, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState, ShortCard } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class MenagerieCounterDefinition implements CounterDefinition<GameState, readonly ShortCard[]> {
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

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): MenagerieCounterDefinition {
		return new MenagerieCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly ShortCard[] {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.cardsPlayedThisMatch ?? [];
	}

	public emit(cardsPlayedThisMatch: readonly ShortCard[]): NonFunctionProperties<MenagerieCounterDefinition> {
		const allPlayedCards = cardsPlayedThisMatch.map((c) => this.allCards.getCard(c.cardId));
		console.debug('allPlayedCards', allPlayedCards, cardsPlayedThisMatch);

		const minionsPlayedWithTribes = allPlayedCards
			.filter((c) => c.type === 'Minion')
			.filter((c) => !!c.races?.length);
		let minionsToProcess: Mutable<ReferenceCard & { picked?: boolean }>[] = [
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
				for (const minion of minionsToProcess) {
					// console.debug('considering minion', minion.name, minion.races);
					if (minion.races.length === i) {
						const raceToAdd = minion.races[0];
						uniqueTribes.push(Race[raceToAdd]);
						// console.debug('added', raceToAdd, uniqueTribes);
						for (const m of minionsToProcess) {
							m.races = m.races.filter((r) => r !== raceToAdd);
							// console.debug('updates races', m.name, m.races, raceToAdd);
						}
						minion.picked = true;
						dirty = true;
					}
				}
				minionsToProcess = minionsToProcess.filter((c) => !c.picked);
			}
		}

		uniqueTribes.push(
			...minionsPlayedWithTribes
				.filter((m) => m.races.includes(Race[Race.ALL]))
				.flatMap((m) => m.races)
				.map((r: string) => Race[r]),
		);
		const tribeText = uniqueTribes
			.map((tribe) => this.i18n.translateString(`global.tribe.${Race[tribe].toLowerCase()}`))
			.sort()
			.join(', ');
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

type Mutable<T> = {
	-readonly [key in keyof T]: T[key];
};
