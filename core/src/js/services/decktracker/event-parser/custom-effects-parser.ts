import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { handleSingleCardBuffInHand } from './card-buffed-in-hand-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

const SUPPORTED_EFFECTS = [
	{
		cardId: CardIds.RunedMithrilRod,
		effect: 'ReuseFX_Generic_HandAE_FriendlySide_Purple_ScaleUp_Super',
	},
];

export class CustomEffectsParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return gameEvent.type === GameEvent.SUB_SPELL_START;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer] = gameEvent.parse();
		const effect = SUPPORTED_EFFECTS.find(
			(e) =>
				e.effect === gameEvent.additionalData?.prefabId &&
				(e.cardId === cardId || e.cardId === gameEvent.additionalData.parentCardId),
		);
		if (!effect) {
			return currentState;
		}

		switch (effect.cardId) {
			case CardIds.RunedMithrilRod:
				return this.handleRunedMithrilRod(currentState, gameEvent);
			default:
				return currentState;
		}
	}

	private handleRunedMithrilRod(currentState: GameState, gameEvent: GameEvent): GameState {
		const [, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const buffingEntityCardId = CardIds.RunedMithrilRod;
		const buffCardId = CardIds.RunedMithrilRod_EnchantingDustEnchantment;
		let newState = currentState;
		for (let i = 0; i < deck.hand.length; i++) {
			const cardToBuff = deck.hand[i];
			newState = handleSingleCardBuffInHand(
				newState,
				gameEvent,
				buffingEntityCardId,
				buffCardId,
				this.helper,
				cardToBuff,
			);
		}
		return newState;
	}

	event(): string {
		return 'CustomEffectsParser';
	}
}
