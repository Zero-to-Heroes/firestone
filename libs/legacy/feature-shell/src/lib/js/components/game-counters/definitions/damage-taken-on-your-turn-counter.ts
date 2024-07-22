import { CardIds } from '@firestone-hs/reference-data';
import { GameState, TurnDamage } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class DamageTakenOnYourTurnCounterDefinition implements CounterDefinition<GameState, readonly TurnDamage[]> {
	readonly type = 'damageTakenOnYourTurn';
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
	): DamageTakenOnYourTurnCounterDefinition {
		return new DamageTakenOnYourTurnCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly TurnDamage[] {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.damageTakenByTurn;
	}

	public emit(damageByTurn: readonly TurnDamage[]): NonFunctionProperties<DamageTakenOnYourTurnCounterDefinition> {
		const totalDamageTakenOnYourTurns = damageByTurn.flatMap((d) => d.damage).reduce((a, b) => a + b, 0);
		const numberOfTimesDamageTakenOnYourTurns = damageByTurn.flatMap((d) => d.damage).length;
		const tooltip = this.i18n.translateString(`counters.damage-taken-on-your-turn.${this.side}`, {
			times: numberOfTimesDamageTakenOnYourTurns,
			damage: totalDamageTakenOnYourTurns,
		});
		return {
			type: 'damageTakenOnYourTurn',
			value: `${numberOfTimesDamageTakenOnYourTurns}/${totalDamageTakenOnYourTurns}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.PartyPlannerVona_VAC_945}.jpg`,
			cssClass: 'damage-taken-on-your-turn-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
