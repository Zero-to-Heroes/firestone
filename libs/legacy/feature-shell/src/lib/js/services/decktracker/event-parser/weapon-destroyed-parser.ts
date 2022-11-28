import { DeckManipulationHelper } from '@services/decktracker/event-parser/deck-manipulation-helper';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class WeaponDestroyedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}
	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.WEAPON_DESTROYED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		if (!deck.weapon) {
			return currentState;
		}

		const updatedWeapon = deck.weapon.update({
			zone: null,
			entityId: -deck.weapon.entityId,
		});
		const newOtherZone = this.helper.addSingleCardToZone(deck.otherZone, updatedWeapon);
		const newPlayerDeck = deck.update({
			weapon: null,
			otherZone: newOtherZone,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.WEAPON_DESTROYED;
	}
}
