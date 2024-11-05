import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { handleSingleCardBuffInHand } from './card-buffed-in-hand-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

const SUPPORTED_EFFECTS = [
	{
		cardId: CardIds.RunedMithrilRod,
		effect: 'ReuseFX_Generic_HandAE_FriendlySide_Purple_ScaleUp_Super',
	},
	// Relic improvement
	{
		cardId: null,
		effect: 'REVFX_Relics_RestOfGameAE_Super',
	},
	{
		cardId: 'GDB_116',
		effect: 'ReuseFX_Generic_HandAE_FriendlySide_Green_ScaleUp_Super',
	},
];

export class CustomEffectsParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer] = gameEvent.parse();
		const effect = SUPPORTED_EFFECTS.find(
			(e) =>
				e.effect === gameEvent.additionalData?.prefabId &&
				(!e.cardId || e.cardId === cardId || e.cardId === gameEvent.additionalData.parentCardId),
		);
		if (!effect) {
			return currentState;
		}

		switch (effect.cardId) {
			case CardIds.RunedMithrilRod:
				return this.handleRunedMithrilRod(currentState, gameEvent);
			case CardIds.EldritchBeing_GDB_116:
				return this.shuffleHand(currentState, gameEvent);
			default:
				switch (effect.effect) {
					case 'REVFX_Relics_RestOfGameAE_Super':
						return this.handleRelicsImprovement(currentState, gameEvent);
				}
				return currentState;
		}
	}

	private shuffleHand(currentState: GameState, gameEvent: GameEvent): GameState {
		const [, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const newHand = deck.hand.map((card) =>
			DeckCard.create({
				entityId: card.entityId,
				zone: 'HAND',
			}),
		);
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: deck.update({
				hand: newHand,
			}),
		});
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

	private handleRelicsImprovement(currentState: GameState, gameEvent: GameEvent): GameState {
		const [, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const newDeck = deck.update({
			relicsPlayedThisMatch: deck.relicsPlayedThisMatch + 1,
		});
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	event(): string {
		return 'CustomEffectsParser';
	}
}
