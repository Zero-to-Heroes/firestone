import { CardType } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class AttackParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// const attackerId = gameEvent.additionalData.attackerEntityId;
		const attackerControllerId = gameEvent.additionalData.attackerControllerId;

		const isPlayer = attackerControllerId === gameEvent.localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const attackerCardId = gameEvent.additionalData.attackerCardId;
		const attackerCard = this.allCards.getCard(attackerCardId);
		const isAttackerHero = attackerCard?.type?.toUpperCase() === CardType[CardType.HERO].toUpperCase();

		if (!isAttackerHero) {
			return currentState;
		}

		const newDeck = deck.update({
			heroAttacksThisMatch: deck.heroAttacksThisMatch + 1,
		});

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	event(): string {
		return 'ATTACK';
	}
}
