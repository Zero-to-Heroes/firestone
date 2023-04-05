import { CardIds } from '@firestone-hs/reference-data';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { MinionsDiedEvent } from '../../../../models/mainwindow/game-events/minions-died-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnFriendlyMinionDiedSecretsParser implements EventParser {
	private secretsTriggeringOnFriendlyMinionDeath = [
		CardIds.Effigy_AT_002,
		CardIds.Duplicate,
		CardIds.GetawayKodo,
		CardIds.RedemptionLegacy,
		CardIds.RedemptionVanilla,
		CardIds.Avenge_FP1_020,
		CardIds.Avenge_CORE_FP1_020,
		CardIds.CheatDeath_CORE_LOOT_204,
		CardIds.CheatDeath_LOOT_204,
		CardIds.EmergencyManeuvers,
		CardIds.EmergencyManeuvers_ImprovedEmergencyManeuversToken,
	];

	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.gameState && gameEvent.type === GameEvent.MINIONS_DIED;
	}

	async parse(currentState: GameState, gameEvent: MinionsDiedEvent): Promise<GameState> {
		const [, , localPlayer] = gameEvent.parse();
		const activePlayerId = gameEvent.gameState.ActivePlayerId;

		const deadEnemyMinions = gameEvent.additionalData.deadMinions.filter(
			(deadMinion) => deadMinion.ControllerId !== activePlayerId,
		);
		if (!deadEnemyMinions?.length) {
			return currentState;
		}

		const isPlayerWithDeadMinion = deadEnemyMinions[0].ControllerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayerWithDeadMinion ? currentState.playerDeck : currentState.opponentDeck;
		const secretsWeCantRuleOut = [];

		// TODO: handle the case where the max hand size has been bumped to 12
		const isHandFull = deckWithSecretToCheck.hand.length >= 10;
		if (isHandFull) {
			secretsWeCantRuleOut.push(CardIds.Duplicate);
			secretsWeCantRuleOut.push(CardIds.GetawayKodo);
			secretsWeCantRuleOut.push(CardIds.CheatDeath_CORE_LOOT_204);
			secretsWeCantRuleOut.push(CardIds.CheatDeath_LOOT_204);
		}

		// If it's the only minion on board, we trigger nothing
		if (deckWithSecretToCheck.board.filter((entity) => !entity.dormant).length === deadEnemyMinions.length) {
			secretsWeCantRuleOut.push(CardIds.Avenge_FP1_020);
			secretsWeCantRuleOut.push(CardIds.Avenge_CORE_FP1_020);
		}
		// TODO: Redemption will not trigger if deathrattles fill up the board

		const optionsToFlagAsInvalid = this.secretsTriggeringOnFriendlyMinionDeath.filter(
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
			[isPlayerWithDeadMinion ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_FRIENDLY_MINION_DEATH';
	}
}
