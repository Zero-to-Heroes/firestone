import { CardClass } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { getGalakrondCardFor } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class GalakrondCounterDefinition
	implements CounterDefinition<GameState, { classes: readonly CardClass[]; galakrondInvokesCount: number }>
{
	readonly type = 'galakrond';
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
	): GalakrondCounterDefinition {
		return new GalakrondCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): { classes: readonly CardClass[]; galakrondInvokesCount: number } {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return {
			classes: deck.hero?.classes,
			galakrondInvokesCount: deck.galakrondInvokesCount,
		};
	}

	public emit(input: {
		classes: readonly CardClass[];
		galakrondInvokesCount: number;
	}): NonFunctionProperties<GalakrondCounterDefinition> {
		const invokeCount = input.galakrondInvokesCount || 0;
		const galakrondCard = input.classes
			?.map((cardClass) => getGalakrondCardFor(cardClass, invokeCount))
			.filter((c) => !!c)?.[0];
		return {
			type: 'galakrond',
			value: invokeCount,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${galakrondCard}.jpg`,
			cssClass: 'galakrond-counter',
			tooltip: this.i18n.translateString(`counters.galakrond.${this.side}`, { value: invokeCount }),
			standardCounter: true,
		};
	}
}
