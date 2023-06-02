import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class ShockspitterCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'shockspitter';
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
	): ShockspitterCounterDefinition {
		return new ShockspitterCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.heroAttacksThisMatch ?? 0;
	}

	public emit(totalHeroAttacks: number): NonFunctionProperties<ShockspitterCounterDefinition> {
		return {
			type: 'shockspitter',
			value: totalHeroAttacks + 1,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Shockspitter}.jpg`,
			cssClass: 'shockspitter-counter',
			tooltip: this.i18n.translateString(`counters.shockspitter.${this.side}`, { value: totalHeroAttacks + 1 }),
			standardCounter: true,
		};
	}
}
