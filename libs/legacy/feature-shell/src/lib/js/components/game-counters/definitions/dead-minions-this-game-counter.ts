import { CardIds } from '@firestone-hs/reference-data';
import { GameState, ShortCard } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class DeadMinionsThisGameCounterDefinition implements CounterDefinition<GameState, readonly ShortCard[]> {
	readonly type = 'deadMinionsThisGame';
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
	): DeadMinionsThisGameCounterDefinition {
		return new DeadMinionsThisGameCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly ShortCard[] {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.minionsDeadThisMatch;
	}

	public emit(deadMinions: readonly ShortCard[]): NonFunctionProperties<DeadMinionsThisGameCounterDefinition> {
		const tooltip = this.i18n.translateString(`counters.dead-minions-this-game.${this.side}`, {
			value: deadMinions.length,
		});
		return {
			type: 'deadMinionsThisGame',
			value: deadMinions.length,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.ReskaThePitBoss_WW_373}.jpg`,
			cssClass: 'dead-minions-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
