import { DeckState, GameState } from '@firestone/game-state';
import { DeckManipulationHelper } from '@services/decktracker/event-parser/deck-manipulation-helper';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class WeaponDestroyedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		// Sometimes the "weapon_equipped" event is fired before the "weapon_destroyed" one
		const updatedWeapon = deck.weapon?.update({
			zone: null,
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
