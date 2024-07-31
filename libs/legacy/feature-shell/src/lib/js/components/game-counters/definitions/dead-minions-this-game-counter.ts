import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class DeadMinionsThisGameCounterDefinition implements CounterDefinition<GameState, number> {
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

	public select(gameState: GameState): number {
		return gameState.playerDeck.minionsDeadThisMatch.length + gameState.opponentDeck.minionsDeadThisMatch.length;
	}

	public emit(deadMinions: number): NonFunctionProperties<DeadMinionsThisGameCounterDefinition> {
		const tooltip = this.i18n.translateString(`counters.dead-minions-this-game.${this.side}`, {
			value: deadMinions,
		});
		return {
			type: 'deadMinionsThisGame',
			value: deadMinions,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.ReskaThePitBoss_WW_373}.jpg`,
			cssClass: 'dead-minions-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
