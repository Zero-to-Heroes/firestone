import { GameState } from '@firestone/game-state';
import { GameEvent } from '@firestone/game-state';
import { EventParser } from './event-parser';

export class ResourcesParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const newPlayerDeck = deck.update({
			manaUsedThisTurn: gameEvent.additionalData.resourcesUsed,
			manaLeft: gameEvent.additionalData.resourcesLeft,
		});
		// console.debug('[resources-parser] resources', isPlayer, gameEvent.additionalData, newPlayerDeck);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.RESOURCES_UPDATED;
	}
}
