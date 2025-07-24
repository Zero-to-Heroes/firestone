import { GameTag } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class SpawnTimeCountChangedParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const newCount = gameEvent.additionalData.count;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const enchantment = deck.enchantments.find((enchantment) => enchantment.entityId === entityId);
		if (!enchantment) {
			return currentState;
		}

		enchantment.tags[GameTag.SPAWN_TIME_COUNT] = newCount;
		const newDeck = deck.update({
			enchantments: [...deck.enchantments.filter((e) => e.entityId !== entityId), enchantment],
		});

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	event(): string {
		return GameEvent.SPAWN_TIME_COUNT_CHANGED;
	}
}
