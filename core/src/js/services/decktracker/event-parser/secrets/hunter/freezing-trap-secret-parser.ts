import { CardType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameState } from '../../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../../models/game-event';
import { DeckManipulationHelper } from '../../deck-manipulation-helper';
import { EventParser } from '../../event-parser';

export class FreezingTrapSecretParser implements EventParser {
	private readonly secretCardId = 'EX1_611';

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return (state && gameEvent.type === GameEvent.ATTACK_ON_HERO) || gameEvent.type === GameEvent.ATTACK_ON_MINION;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const attackedPlayerControllerId = gameEvent.additionalData.targetControllerId;
		const isPlayedBeingAttacked = attackedPlayerControllerId === gameEvent.localPlayer.PlayerId;
		const activePlayerId = gameEvent.gameState.ActivePlayerId;
		const deckWithSecretToCheck = isPlayedBeingAttacked ? currentState.playerDeck : currentState.opponentDeck;
		if (isPlayedBeingAttacked && activePlayerId === gameEvent.localPlayer.PlayerId) {
			console.log(
				'[freezing-trap]',
				'player being attacked and active player is player',
				isPlayedBeingAttacked,
				activePlayerId,
				gameEvent,
			);
			return currentState;
		}
		if (!isPlayedBeingAttacked && activePlayerId === gameEvent.opponentPlayer.PlayerId) {
			console.log(
				'[freezing-trap]',
				'opp being attacked and active player is opp',
				isPlayedBeingAttacked,
				activePlayerId,
				gameEvent,
			);
			return currentState;
		}
		const sourceCardId = gameEvent.additionalData.sourceCardId;
		// Check that the attacker is a minion
		const dbCard = this.allCards.getCard(sourceCardId);
		if (!dbCard || !dbCard.type || dbCard.type.toLowerCase() !== CardType[CardType.MINION].toLowerCase()) {
			console.log('[freezing-trap]', 'card is not minion', dbCard, sourceCardId, gameEvent);
			return currentState;
		}
		// Freezing trap doesn't trigger if the attacker is mortally wounded
		// const attackingEntity = this.helper.findEntityInGameState(
		// 	gameEvent.gameState,
		// 	gameEvent.additionalData.sourceEntityId,
		// );
		// if (!attackingEntity || attackingEntity.health < 1) {
		// 	console.log(
		// 		'[freezing-trap]',
		// 		'invalid attacking entity',
		// 		attackingEntity,
		// 		gameEvent.gameState,
		// 		gameEvent.additionalData.sourceEntityId,
		// 	);
		// 	return currentState;
		// }
		const newPlayerDeck = this.helper.removeSecretOption(deckWithSecretToCheck, this.secretCardId);
		return Object.assign(new GameState(), currentState, {
			[isPlayedBeingAttacked ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_FREEZING_TRAP';
	}
}
