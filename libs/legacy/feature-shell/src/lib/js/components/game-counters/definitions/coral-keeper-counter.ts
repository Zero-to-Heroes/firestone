import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class CoralKeeperCounterDefinition implements CounterDefinition {
	readonly type = 'coralKeeper';
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
	): CoralKeeperCounterDefinition {
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
		const totalSummons = uniqueSpellSchools?.length;
		const tooltip = i18n.translateString(`counters.coral-keeper.${side}`, {
			totalSummons: totalSummons,
			schools: uniqueSpellSchools
				?.map((spellSchool) => i18n.translateString('global.spellschool.' + spellSchool.toLowerCase()))
				?.join(', '),
		});
		return {
			type: 'coralKeeper',
			value: `${totalSummons}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.CoralKeeper}.jpg`,
			cssClass: 'spell-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
