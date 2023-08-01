import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class ChainedGuardianCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'chainedGuardian';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): ChainedGuardianCounterDefinition {
		return new ChainedGuardianCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.plaguesShuffledIntoEnemyDeck ?? 0;
	}

	public emit(plaguesShuffledIntoEnemyDeck: number): NonFunctionProperties<ChainedGuardianCounterDefinition> {
		return {
			type: 'chainedGuardian',
			value: plaguesShuffledIntoEnemyDeck,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.ChainedGuardian}.jpg`,
			cssClass: 'pogo-counter',
			tooltip: this.i18n.translateString(`counters.plagues.${this.side}`, {
				value: plaguesShuffledIntoEnemyDeck,
			}),
			standardCounter: true,
		};
	}
}
