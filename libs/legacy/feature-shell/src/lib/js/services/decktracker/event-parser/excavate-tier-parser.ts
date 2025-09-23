import { GameState } from '@firestone/game-state';
import { GameEvent } from '@firestone/game-state';
import { EventParser } from './event-parser';

export class ExcavateTierParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const newPlayerDeck = deck.update({
			currentExcavateTier: gameEvent.additionalData.currentTier,
			maxExcavateTier: gameEvent.additionalData.maxTier,
			totalExcavates:
				gameEvent.additionalData.currentTier === deck.totalExcavates
					? deck.totalExcavates
					: deck.totalExcavates + 1,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.EXCAVATE_TIER_CHANGED;
	}
}
