import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class CoralKeeperCounterDefinition implements CounterDefinition<GameState, readonly DeckCard[]> {
	readonly type = 'coralKeeper';
	readonly value: number | string;
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
	): CoralKeeperCounterDefinition {
		return new CoralKeeperCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly DeckCard[] {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.spellsPlayedThisMatch ?? [];
	}

	public emit(spellsPlayedThisMatch: readonly DeckCard[]): NonFunctionProperties<CoralKeeperCounterDefinition> {
		const uniqueSpellSchools = [
			...new Set(
				(spellsPlayedThisMatch ?? [])
					.map((card) => card.cardId)
					.map((cardId) => this.allCards.getCard(cardId).spellSchool)
					.filter((spellSchool) => !!spellSchool),
			),
		];
		const totalSummons = uniqueSpellSchools?.length;
		const tooltip = this.i18n.translateString(`counters.coral-keeper.${this.side}`, {
			totalSummons: totalSummons,
			schools: uniqueSpellSchools
				?.map((spellSchool) => this.i18n.translateString('global.spellschool.' + spellSchool.toLowerCase()))
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
