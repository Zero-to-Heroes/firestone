import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

const PRIORITY_LIST = [
	// CardIds.YoggSaronUnleashed_YOG_516,
	CardIds.YoggSaronHopesEnd_OG_134,
	CardIds.YoggSaronMasterOfFate,
	CardIds.ArcaneGiant,
];
export class SpellCounterDefinition
	implements
		CounterDefinition<
			GameState,
			{
				spellsPlayed: number;
				allCardsInDeck: readonly string[];
			}
		>
{
	readonly type = 'spells';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
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
	): SpellCounterDefinition {
		return new SpellCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): {
		spellsPlayed: number;
		allCardsInDeck: readonly string[];
	} {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return {
			spellsPlayed: deck.spellsPlayedThisMatch?.length ?? 0,
			allCardsInDeck: deck.getAllCardsInDeck().map((c) => c.cardId),
		};
	}

	public emit(info: {
		spellsPlayed: number;
		allCardsInDeck: readonly string[];
	}): NonFunctionProperties<SpellCounterDefinition> {
		let iconToShow = CardIds.YoggSaronHopesEnd_OG_134;
		for (const cardId of PRIORITY_LIST) {
			if (info.allCardsInDeck.includes(cardId)) {
				iconToShow = cardId;
				break;
			}
		}
		return {
			type: 'spells',
			value: info.spellsPlayed,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${iconToShow}.jpg`,
			cssClass: 'spell-counter',
			tooltip: this.i18n.translateString(`counters.spell.${this.side}`, { value: info.spellsPlayed }),
			standardCounter: true,
		};
	}
}
