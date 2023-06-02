import { CardIds, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class MenagerieCounterDefinition implements CounterDefinition {
	readonly type = 'menagerie';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly cardTooltips?: readonly string[];
	readonly standardCounter = true;

	static create(
		gameState: GameState,
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): MenagerieCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const allPlayedCards = deck.cardsPlayedThisMatch.map((c) => allCards.getCard(c.cardId));
		// console.debug('allPlayedCards', allPlayedCards, deck.cardsPlayedThisMatch);

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
				.map((r) => Race[r]),
		);
		const tribeText = uniqueTribes
			.map((tribe) => i18n.translateString(`global.tribe.${Race[tribe].toLowerCase()}`))
			.sort()
			.join(', ');
		const tooltip = i18n.translateString(`counters.menagerie.${side}`, {
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
