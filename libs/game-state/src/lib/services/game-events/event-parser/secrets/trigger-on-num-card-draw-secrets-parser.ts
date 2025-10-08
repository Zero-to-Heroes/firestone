import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BoardSecret } from '../../../../models/board-secret';
import { DeckState } from '../../../../models/deck-state';
import { GameState } from '../../../../models/game-state';
import { GameEvent } from '../../game-event';
import { EventParser } from '../_event-parser';
import { DeckManipulationHelper } from '../deck-manipulation-helper';

export class TriggerOnNumCardDrawSecretsParser implements EventParser {
	private secretsTriggeringOnCardDraw = [CardIds.Shenanigans];

	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.NUM_CARDS_DRAW_THIS_TURN;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, cardPlayedControllerId, localPlayer] = gameEvent.parse();
		const isPlayerWhoDrewCard = cardPlayedControllerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayerWhoDrewCard ? currentState.opponentDeck : currentState.playerDeck;

		const toExclude: CardIds[] = [];
		if (gameEvent.additionalData.cardsDrawn < 2 || currentState.opponentDeck.isActivePlayer) {
			toExclude.push(CardIds.Shenanigans);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnCardDraw.filter(
			(secret) => toExclude.indexOf(secret) === -1,
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
