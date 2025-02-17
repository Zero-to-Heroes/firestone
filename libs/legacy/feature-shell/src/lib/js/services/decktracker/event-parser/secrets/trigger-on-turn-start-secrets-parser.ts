import { CardIds } from '@firestone-hs/reference-data';
import { BoardSecret, DeckState, GameState } from '@firestone/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnTurnStartSecretsParser implements EventParser {
	private secretsTriggeringOnTurnStart = [
		CardIds.CompetitiveSpirit_AT_073,
		CardIds.OpenTheCages,
		CardIds.Perjury,
		CardIds.BeaststalkerTavish_ImprovedOpenTheCagesToken,
		CardIds.SummoningWard_DEEP_000,
	];

	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.TURN_START;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, , localPlayer] = gameEvent.parse();
		const activePlayerId = gameEvent.additionalData.activePlayerId;
		// Can happen at the very start of the game
		if (!localPlayer) {
			return currentState;
		}

		const isPlayerActive = activePlayerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayerActive ? currentState.playerDeck : currentState.opponentDeck;
		const secretsWeCantRuleOut = [];

		// TODO: handle UNTOUCHABLE, DORMANT
		const isBoardEmpty = deckWithSecretToCheck.board.length === 0;
		if (isBoardEmpty) {
			secretsWeCantRuleOut.push(CardIds.CompetitiveSpirit_AT_073);
			secretsWeCantRuleOut.push(CardIds.SummoningWard_DEEP_000);
		}

		const isBoardFull = deckWithSecretToCheck.board.length === 7;
		if (isBoardFull) {
			secretsWeCantRuleOut.push(CardIds.SummoningWard_DEEP_000);
		}

		// Only triggers if board has between 2 and 6 minions
		if (deckWithSecretToCheck.board.filter((entity) => !entity.dormant).length < 2 || isBoardFull) {
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
