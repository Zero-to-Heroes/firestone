import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { BoardSecret } from '../../../../models/board-secret';
import { DeckState } from '../../../../models/deck-state';
import { GameState } from '../../../../models/game-state';
import { isDormant } from '../../../card-utils';
import { getEntityTag } from '../../../parser-entity-utils';
import { MinionsDiedEvent } from '../../events/minions-died-event';
import { GameEvent } from '../../game-event';
import { EventParser } from '../_event-parser';
import { DeckManipulationHelper } from '../deck-manipulation-helper';

// Untimely Death (TIME_620): Secret: When a friendly minion dies the turn after being played, resummon it.

export class TriggerOnFriendlyMinionDiedSecretsParser implements EventParser {
	private secretsTriggeringOnFriendlyMinionDeath = [
		CardIds.Effigy_AT_002,
		CardIds.Duplicate,
		CardIds.GetawayKodo,
		CardIds.RedemptionLegacy,
		CardIds.RedemptionVanilla,
		CardIds.Avenge_FP1_020,
		CardIds.Avenge_CORE_FP1_020,
		CardIds.CheatDeathCore,
		CardIds.CheatDeath,
		CardIds.EmergencyManeuvers,
		CardIds.EmergencyManeuvers_ImprovedEmergencyManeuversToken,
		CardIds.UntimelyDeath_TIME_620,
	];

	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.MINIONS_DIED;
	}

	async parse(currentState: GameState, gameEvent: MinionsDiedEvent): Promise<GameState> {
		const [, , localPlayer] = gameEvent.parse();
		const activePlayerId = gameEvent.additionalData.activePlayerId;

		const deadEnemyMinions = gameEvent.additionalData.deadMinions.filter(
			(deadMinion) => deadMinion.ControllerId !== activePlayerId,
		);
		if (!deadEnemyMinions?.length) {
			return currentState;
		}

		const isPlayerWithDeadMinion = deadEnemyMinions[0].ControllerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayerWithDeadMinion ? currentState.playerDeck : currentState.opponentDeck;
		const secretsWeCantRuleOut: CardIds[] = [];

		// TODO: handle the case where the max hand size has been bumped to 12
		const isHandFull = deckWithSecretToCheck.hand.length >= 10;
		if (isHandFull) {
			secretsWeCantRuleOut.push(CardIds.Duplicate);
			secretsWeCantRuleOut.push(CardIds.GetawayKodo);
			secretsWeCantRuleOut.push(CardIds.CheatDeathCore);
			secretsWeCantRuleOut.push(CardIds.CheatDeath);
		}

		// If it's the only minion on board, we trigger nothing
		if (
			deckWithSecretToCheck.board.filter(
				(entity) => !isDormant(entity, currentState.parserState?.CurrentEntities),
			).length === deadEnemyMinions.length
		) {
			secretsWeCantRuleOut.push(CardIds.Avenge_FP1_020);
			secretsWeCantRuleOut.push(CardIds.Avenge_CORE_FP1_020);
		}
		// TODO: Redemption will not trigger if deathrattles fill up the board

		// currentTurn is ceil(gameTagTurn/2), so "the turn after being played" is the same
		// currentTurn only for first-player minions. NUM_TURNS_IN_PLAY increments every
		// player-turn and is 1 exactly when the minion dies the turn after entering play.
		const diedTheTurnAfterBeingPlayed = deadEnemyMinions.some((deadMinion) => {
			const wasPlayed = deckWithSecretToCheck.cardsPlayedThisMatch.some(
				(card) => card.entityId === deadMinion.EntityId,
			);
			if (!wasPlayed) {
				return false;
			}
			const entity = currentState.parserState?.CurrentEntities?.get(deadMinion.EntityId);
			return getEntityTag(entity, GameTag.NUM_TURNS_IN_PLAY, 0) === 1;
		});
		if (!diedTheTurnAfterBeingPlayed) {
			secretsWeCantRuleOut.push(CardIds.UntimelyDeath_TIME_620);
		}

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
