import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class WeaponDestroyedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		// Sometimes the "weapon_equipped" event is fired before the "weapon_destroyed" one
		if (deck.weapon?.entityId !== entityId) {
			return currentState;
		}
		const updatedWeapon = deck.weapon?.update({
			zone: undefined,
			entityId: -deck.weapon.entityId,
		});
		let newOtherZone = !!updatedWeapon
			? this.helper.removeSingleCardFromZone(deck.otherZone, updatedWeapon.cardId, updatedWeapon.entityId)[0]
			: deck.otherZone;
		newOtherZone = !!updatedWeapon ? this.helper.addSingleCardToZone(newOtherZone, updatedWeapon) : newOtherZone;
		const newPlayerDeck = deck.update({
			weapon: deck.weapon?.cardId === cardId ? null : deck.weapon,
			otherZone: newOtherZone,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
			miscCardsDestroyed: [...(currentState.miscCardsDestroyed || []), cardId],
		});
	}

	event(): string {
		return GameEvent.WEAPON_DESTROYED;
	}
}
