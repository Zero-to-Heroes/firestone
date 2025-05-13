import { GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class MaxResourcesUpdatedParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const playerId = gameEvent.additionalData.playerId;
		const newMaxMana = gameEvent.additionalData.mana;
		const newMaxHealth = gameEvent.additionalData.health;
		const newMaxCoins = gameEvent.additionalData.coins;
		const newHero = deck.hero.update({
			maxMana: newMaxMana ? newMaxMana : deck.hero.maxMana,
			maxHealth: newMaxHealth ? newMaxHealth : deck.hero.maxHealth,
			maxCoins: newMaxCoins ? newMaxCoins : deck.hero.maxCoins,
		});
		const newDeck = deck.update({
			hero: newHero,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	event(): string {
		return GameEvent.MAX_RESOURCES_UPDATED;
	}
}
