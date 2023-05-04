import { CardIds, Race } from '@firestone-hs/reference-data';
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
		const allTribes: Race[] = allPlayedCards
			.filter((c) => c.type === 'Minion')
			.filter((c) => !!c.races?.length)
			.flatMap((c) => c.races)
			.map((r) => Race[r]);
		const uniqueTribes: Race[] = [];
		for (const tribe of allTribes) {
			if (!uniqueTribes.includes(tribe) || tribe === Race.ALL) {
				uniqueTribes.push(tribe);
			}
		}

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
