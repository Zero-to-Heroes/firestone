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
		// WEAPON_EQUIPPED for a replacement can arrive before WEAPON_DESTROYED for the previous
		// one. A new weapon always has a new entity id, so entity id is enough to ignore that
		// stale destroy. Do not also require cardId equality: transforming weapons keep the
		// same entity id after CHANGE_ENTITY, so a cardId check would leave them equipped.
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
			weapon: null,
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
