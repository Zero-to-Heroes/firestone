import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class AttackCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'attack';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = false;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): AttackCounterDefinition {
		return new AttackCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const totalAttackOnBoard = (deck.totalAttackOnBoard?.board || 0) + (deck.totalAttackOnBoard?.hero || 0);
		console.debug('[attack-counter] totalAttackOnBoard', this.side, totalAttackOnBoard);
		return totalAttackOnBoard;
	}

	public emit(totalAttackOnBoard: number): NonFunctionProperties<AttackCounterDefinition> {
		console.debug('[attack-counter] emitting', this.side, totalAttackOnBoard);
		return {
			type: 'attack',
			value: totalAttackOnBoard,
			image: 'assets/svg/attack.svg',
			cssClass: 'attack-counter',
			tooltip: this.i18n.translateString(`counters.attack.${this.side}`, { value: totalAttackOnBoard }),
			standardCounter: false,
		};
	}
}
