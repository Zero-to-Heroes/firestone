import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { EventParser } from '../event-parser';

export const PLAGUES = [
	CardIds.DistressedKvaldir_BloodPlagueToken,
	CardIds.DistressedKvaldir_FrostPlagueToken,
	CardIds.DistressedKvaldir_UnholyPlagueToken,
];

export class PlaguesParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return (
			state &&
			[GameEvent.CREATE_CARD_IN_DECK, GameEvent.CARD_CHANGED_IN_DECK].includes(gameEvent.type) &&
			PLAGUES.includes(gameEvent.cardId as CardIds)
		);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer] = gameEvent.parse();
		// Is the plague created in the player's deck, or the opponent?
		const isCardInPlayerDeck = controllerId === localPlayer.PlayerId;
		const deckToUpdate = isCardInPlayerDeck ? currentState.opponentDeck : currentState.playerDeck;
		const newDeck = deckToUpdate.update({
			plaguesShuffledIntoEnemyDeck: (deckToUpdate.plaguesShuffledIntoEnemyDeck ?? 0) + 1,
		});

		return currentState.update({
			[isCardInPlayerDeck ? 'opponentDeck' : 'playerDeck']: newDeck,
		} as any);
	}

	event(): string {
		return 'PLAGUES';
	}
}
