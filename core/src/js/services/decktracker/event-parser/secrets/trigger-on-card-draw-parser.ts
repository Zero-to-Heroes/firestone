import { AllCardsService } from '@firestone-hs/replay-parser';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnCardDrawParser implements EventParser {
	private secretsTriggeringOnCardDraw = [
		// CardIds.Collectible.Rogue.Shenanigans
	];

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.gameState && gameEvent.type === GameEvent.CARD_DRAW_FROM_DECK;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, cardPlayedControllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayerWhoDrewCard = cardPlayedControllerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayerWhoDrewCard ? currentState.opponentDeck : currentState.playerDeck;

		// TODO: maybe we'll get a new game tab like NUM_CARDS_DRAWN_THIS_TURN which would
		// make our life easier, so let's wait and see for now
		const toExclude = [];
		if (gameEvent.additionalData.cardDrawn < 2) {
			// toExclude.push(CardIds.Collectible.Hunter.Shenanigans);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnCardDraw.filter(
			secret => toExclude.indexOf(secret) === -1,
		);
		let secrets: BoardSecret[] = [...deckWithSecretToCheck.secrets];
		for (const secret of optionsToFlagAsInvalid) {
			secrets = [...this.helper.removeSecretOptionFromSecrets(secrets, secret)];
		}
		const newPlayerDeck = deckWithSecretToCheck.update({
			secrets: secrets as readonly BoardSecret[],
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayerWhoDrewCard ? 'opponentDeck' : 'playerDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_CARD_DRAW';
	}
}
