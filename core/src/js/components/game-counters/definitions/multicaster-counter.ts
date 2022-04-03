import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class MulticasterCounterDefinition implements CounterDefinition {
	readonly type = 'multicaster';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(
		gameState: GameState,
		side: string,
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): MulticasterCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const uniqueSpellSchools = [
			...new Set(
				(deck.spellsPlayedThisMatch ?? [])
					.map((card) => card.cardId)
					.map((cardId) => allCards.getCard(cardId).spellSchool)
					.filter((spellSchool) => !!spellSchool),
			),
		];
		// console.debug('spell schools', uniqueSpellSchools);
		const totalCardsToDraw = uniqueSpellSchools?.length;
		const tooltip = i18n.translateString(`counters.multicaster.${side}`, {
			cardsTotal: totalCardsToDraw,
			schools: uniqueSpellSchools
				?.map((spellSchool) => i18n.translateString('global.spellschool.' + spellSchool.toLowerCase()))
				?.join(', '),
		});
		return {
			type: 'multicaster',
			value: `${totalCardsToDraw}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Multicaster}.jpg`,
			cssClass: 'spell-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
