import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DamageGameEvent } from '../../../models/mainwindow/game-events/damage-game-event';
import { EventParser } from './event-parser';

export class HeroPowerDamageParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: DamageGameEvent): Promise<GameState> {
		const localPlayerId = gameEvent.localPlayer?.PlayerId;
		const damageDealtByLocalPlayerHeroPower = Object.values(gameEvent.additionalData.targets)
			.filter((target) => target.SourceControllerId === localPlayerId)
			.filter(
				(target) =>
					this.allCards
						.getCard(target.SourceCardId ?? gameEvent.additionalData.sourceCardId)
						?.type?.toLowerCase() === 'hero_power',
			)
			.map((target) => target.Damage)
			.reduce((a, b) => a + b, 0);

		const opponentPlayerId = gameEvent.opponentPlayer?.PlayerId;
		const damageDealtByOpponentPlayerHeroPower = Object.values(gameEvent.additionalData.targets)
			.filter((target) => target.SourceControllerId === opponentPlayerId)
			.filter(
				(target) =>
					this.allCards
						.getCard(target.SourceCardId ?? gameEvent.additionalData.sourceCardId)
						?.type?.toLowerCase() === 'hero_power',
			)
			.map((target) => target.Damage)
			.reduce((a, b) => a + b, 0);

		const playerDeck = currentState.playerDeck.update({
			heroPowerDamageThisMatch:
				currentState.playerDeck.heroPowerDamageThisMatch + damageDealtByLocalPlayerHeroPower,
		} as DeckState);
		const opponentDeck = currentState.opponentDeck.update({
			heroPowerDamageThisMatch:
				currentState.opponentDeck.heroPowerDamageThisMatch + damageDealtByOpponentPlayerHeroPower,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			playerDeck: playerDeck,
			opponentDeck: opponentDeck,
		} as GameState);
	}

	event(): string {
		return GameEvent.DAMAGE;
	}
}
