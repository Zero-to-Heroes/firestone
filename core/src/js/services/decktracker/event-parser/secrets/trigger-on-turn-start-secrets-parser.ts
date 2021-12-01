import { CardIds } from '@firestone-hs/reference-data';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnTurnStartSecretsParser implements EventParser {
	private secretsTriggeringOnTurnStart = [
		CardIds.CompetitiveSpirit1,
		CardIds.OpenTheCages,
		CardIds.BeaststalkerTavish_ImprovedOpenTheCagesToken,
	];

	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.gameState && gameEvent.type === GameEvent.TURN_START;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, , localPlayer] = gameEvent.parse();
		const activePlayerId = gameEvent.gameState.ActivePlayerId;
		// Can happen at the very start of the game
		if (!localPlayer) {
			return currentState;
		}

		const isPlayerActive = activePlayerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayerActive ? currentState.playerDeck : currentState.opponentDeck;
		const secretsWeCantRuleOut = [];

		const isBoardEmpty = deckWithSecretToCheck.board.length === 0;
		if (isBoardEmpty) {
			secretsWeCantRuleOut.push(CardIds.CompetitiveSpirit1);
		}

		// Only triggers if board has between 2 and 6 minions
		if (
			deckWithSecretToCheck.board.filter((entity) => !entity.dormant).length < 2 ||
			deckWithSecretToCheck.board.length === 7
		) {
			secretsWeCantRuleOut.push(CardIds.BeaststalkerTavish_ImprovedOpenTheCagesToken);
			secretsWeCantRuleOut.push(CardIds.OpenTheCages);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnTurnStart.filter(
			(secret) => secretsWeCantRuleOut.indexOf(secret) === -1,
		);

		let secrets: BoardSecret[] = [...deckWithSecretToCheck.secrets];
		for (const secret of optionsToFlagAsInvalid) {
			secrets = [...this.helper.removeSecretOptionFromSecrets(secrets, secret)];
		}
		const newPlayerDeck = deckWithSecretToCheck.update({
			secrets: secrets as readonly BoardSecret[],
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayerActive ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_TURN_START';
	}
}
