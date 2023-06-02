import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class NagaGiantCounterDefinition implements CounterDefinition {
	readonly type = 'nagaGiant';
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
	): NagaGiantCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const giantBaseCost = allCards.getCard(CardIds.NagaGiant)?.cost;
		const spellsPlayed = deck.spellsPlayedThisMatch?.length ?? 0;
		const totalCostReduction = deck.manaSpentOnSpellsThisMatch ?? 0;
		const costAfterReduction = Math.max(0, giantBaseCost - totalCostReduction);
		return {
			type: 'nagaGiant',
			value: costAfterReduction,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.NagaGiant}.jpg`,
			cssClass: 'naga-giant-counter',
			tooltip: i18n.translateString(`counters.naga-giant.${side}`, {
				cost: costAfterReduction,
				spells: spellsPlayed,
			}),
			standardCounter: true,
		};
	}
}
