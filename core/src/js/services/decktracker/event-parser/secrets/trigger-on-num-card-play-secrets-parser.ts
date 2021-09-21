import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnNumCardPlaySecretsParser implements EventParser {
	private secretsTriggeringOnAttack = [CardIds.RatTrap, CardIds.HiddenWisdom, CardIds.GallopingSavior];

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.gameState && gameEvent.type === GameEvent.NUM_CARDS_PLAYED_THIS_TURN;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, cardPlayedControllerId, localPlayer] = gameEvent.parse();
		const isPlayerWhoPlayedCard = cardPlayedControllerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayerWhoPlayedCard ? currentState.opponentDeck : currentState.playerDeck;

		const toExclude = [];
		if (gameEvent.additionalData.cardsPlayed < 3) {
			toExclude.push(CardIds.RatTrap);
			toExclude.push(CardIds.HiddenWisdom);
			toExclude.push(CardIds.GallopingSavior);
		}
		if (deckWithSecretToCheck.board.length === 7) {
			toExclude.push(CardIds.RatTrap);
			toExclude.push(CardIds.GallopingSavior);
		}
		if (deckWithSecretToCheck.hand.length === 10) {
			toExclude.push(CardIds.HiddenWisdom);
		}
		const optionsToFlagAsInvalid = this.secretsTriggeringOnAttack.filter(
			(secret) => toExclude.indexOf(secret) === -1,
		);
		let secrets: BoardSecret[] = [...deckWithSecretToCheck.secrets];
		for (const secret of optionsToFlagAsInvalid) {
			// console.log('marking as invalid', secret, secrets);
			secrets = [...this.helper.removeSecretOptionFromSecrets(secrets, secret)];
			// console.log('marked as invalid', secret, newPlayerDeck);
		}
		const newPlayerDeck = deckWithSecretToCheck.update({
			secrets: secrets as readonly BoardSecret[],
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayerWhoPlayedCard ? 'opponentDeck' : 'playerDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_NUM_CARDS_PLAYED';
	}
}
