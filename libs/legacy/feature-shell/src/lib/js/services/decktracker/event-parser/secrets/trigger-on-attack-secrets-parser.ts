import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

// https://hearthstone.gamepedia.com/Advanced_rulebook#Combat
export class TriggerOnAttackSecretsParser implements EventParser {
	private secretsTriggeringOnAttack = [
		CardIds.BearTrap,
		CardIds.MisdirectionLegacy,
		CardIds.MisdirectionVanilla,
		CardIds.BeaststalkerTavish_ImprovedSnakeTrapToken,
		CardIds.SnakeTrapLegacy,
		CardIds.SnakeTrap_CORE_EX1_554,
		CardIds.SnakeTrapVanilla,
		CardIds.BeaststalkerTavish_ImprovedPackTacticsToken,
		CardIds.PackTactics,
		CardIds.BeaststalkerTavish_ImprovedExplosiveTrapToken,
		CardIds.ExplosiveTrapLegacy_EX1_610,
		CardIds.ExplosiveTrapCore,
		CardIds.ExplosiveTrapVanilla,
		CardIds.BeaststalkerTavish_ImprovedFreezingTrapToken,
		CardIds.FreezingTrapLegacy,
		CardIds.FreezingTrapCore,
		CardIds.FreezingTrapVanilla,
		CardIds.VenomstrikeTrap_ICC_200,
		CardIds.WanderingMonsterCore,
		CardIds.WanderingMonster,
		CardIds.FlameWard,
		CardIds.IceBarrierLegacy,
		CardIds.IceBarrierCore,
		CardIds.IceBarrierVanilla,
		CardIds.OasisAlly,
		CardIds.SplittingImage_TRL_400,
		CardIds.VaporizeLegacy,
		CardIds.VaporizeVanilla,
		CardIds.AutodefenseMatrix_BOT_908,
		CardIds.NobleSacrifice,
		CardIds.NobleSacrificeLegacy,
		CardIds.NobleSacrificeVanilla,
		CardIds.JudgmentOfJustice,
		CardIds.Bamboozle,
		CardIds.ShadowClone,
		CardIds.SuddenBetrayal,
		CardIds.VengefulVisage,
	];

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return (
			state &&
			gameEvent.gameState &&
			(gameEvent.type === GameEvent.ATTACKING_HERO ||
				gameEvent.type === GameEvent.ATTACKING_MINION ||
				gameEvent.type === GameEvent.SECRET_TRIGGERED)
		);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		if (gameEvent.type === GameEvent.ATTACKING_HERO || gameEvent.type === GameEvent.ATTACKING_MINION) {
			return this.handleAttack(currentState, gameEvent, (deck: DeckState, secret: BoardSecret) => true);
		} else if (gameEvent.type === GameEvent.SECRET_TRIGGERED) {
			return this.handleSecretTriggered(currentState, gameEvent);
		}
		console.warn('[trigger-on-attack] invalid event', gameEvent.type);
		return currentState;
	}

	// Here we should probably retrieve the PROPOSED_* entities, and apply the same logic as real attacks
	// (on the old secrets) to rule out the ones that would have triggered otherwise
	private async handleSecretTriggered(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		return currentState;
	}

	private async handleAttack(
		currentState: GameState,
		gameEvent: GameEvent,
		isSecretToBeConsidered: (deck: DeckState, secret: BoardSecret) => boolean,
	): Promise<GameState> {
		const attackerId = gameEvent.additionalData.attackerEntityId;
		const defenderId = gameEvent.additionalData.defenderEntityId;
		const defenderControllerId = gameEvent.additionalData.defenderControllerId;
		const attackerControllerId = gameEvent.additionalData.attackerControllerId;
		if (defenderControllerId === attackerControllerId) {
			return currentState;
		}

		const isPlayerTheAttackedParty = defenderControllerId === gameEvent.localPlayer.PlayerId;
		const activePlayerId = gameEvent.gameState.ActivePlayerId;
		const deckWithSecretToCheck = isPlayerTheAttackedParty ? currentState.playerDeck : currentState.opponentDeck;
		if (isPlayerTheAttackedParty && activePlayerId === gameEvent.localPlayer.PlayerId) {
			return currentState;
		}
		if (!isPlayerTheAttackedParty && activePlayerId === gameEvent.opponentPlayer.PlayerId) {
			return currentState;
		}

		const isBoardFull = deckWithSecretToCheck.board.length === 7;

		// Check that the attacker is a minion
		const attackerCardId = gameEvent.additionalData.attackerCardId;
		const defenderCardId = gameEvent.additionalData.defenderCardId;
		const attackerCard = this.allCards.getCard(attackerCardId);
		const isAttackerMinion =
			attackerCard &&
			attackerCard.type &&
			attackerCard.type.toLowerCase() === CardType[CardType.MINION].toLowerCase();
		const defenderCard = this.allCards.getCard(defenderCardId);
		const isDefenderMinion =
			defenderCard &&
			defenderCard.type &&
			defenderCard.type.toLowerCase() === CardType[CardType.MINION].toLowerCase();
		const isDefenderDivineShield =
			gameEvent.additionalData.defenderTags &&
			gameEvent.additionalData.defenderTags.find(
				(tag) => (tag.Name as number) === GameTag.DIVINE_SHIELD && (tag.Value as number) === 1,
			);

		const enemyBoard = (isPlayerTheAttackedParty ? currentState.opponentDeck : currentState.playerDeck).board;

		const secretsWeCantRuleOut = [];
		if (isBoardFull) {
			secretsWeCantRuleOut.push(CardIds.BearTrap);
			secretsWeCantRuleOut.push(CardIds.BeaststalkerTavish_ImprovedSnakeTrapToken);
			secretsWeCantRuleOut.push(CardIds.SnakeTrapLegacy);
			secretsWeCantRuleOut.push(CardIds.SnakeTrap_CORE_EX1_554);
			secretsWeCantRuleOut.push(CardIds.SnakeTrapVanilla);
			secretsWeCantRuleOut.push(CardIds.BeaststalkerTavish_ImprovedPackTacticsToken);
			secretsWeCantRuleOut.push(CardIds.PackTactics);
			secretsWeCantRuleOut.push(CardIds.SplittingImage_TRL_400);
			secretsWeCantRuleOut.push(CardIds.OasisAlly);
			secretsWeCantRuleOut.push(CardIds.NobleSacrificeLegacy);
			secretsWeCantRuleOut.push(CardIds.NobleSacrifice);
			secretsWeCantRuleOut.push(CardIds.NobleSacrificeVanilla);
			secretsWeCantRuleOut.push(CardIds.ShadowClone);
			secretsWeCantRuleOut.push(CardIds.VengefulVisage);
		}
		if (!isAttackerMinion) {
			secretsWeCantRuleOut.push(CardIds.BeaststalkerTavish_ImprovedFreezingTrapToken);
			secretsWeCantRuleOut.push(CardIds.FreezingTrapLegacy);
			secretsWeCantRuleOut.push(CardIds.FreezingTrapCore);
			secretsWeCantRuleOut.push(CardIds.FreezingTrapVanilla);
			secretsWeCantRuleOut.push(CardIds.VaporizeLegacy);
			secretsWeCantRuleOut.push(CardIds.VaporizeVanilla);
			secretsWeCantRuleOut.push(CardIds.FlameWard);
			secretsWeCantRuleOut.push(CardIds.JudgmentOfJustice);
			secretsWeCantRuleOut.push(CardIds.SuddenBetrayal);
			secretsWeCantRuleOut.push(CardIds.ShadowClone);
			secretsWeCantRuleOut.push(CardIds.VengefulVisage);
		}
		if (!isDefenderMinion) {
			secretsWeCantRuleOut.push(CardIds.BeaststalkerTavish_ImprovedSnakeTrapToken);
			secretsWeCantRuleOut.push(CardIds.SnakeTrapLegacy);
			secretsWeCantRuleOut.push(CardIds.SnakeTrap_CORE_EX1_554);
			secretsWeCantRuleOut.push(CardIds.SnakeTrapVanilla);
			secretsWeCantRuleOut.push(CardIds.BeaststalkerTavish_ImprovedPackTacticsToken);
			secretsWeCantRuleOut.push(CardIds.PackTactics);
			secretsWeCantRuleOut.push(CardIds.VenomstrikeTrap_ICC_200);
			secretsWeCantRuleOut.push(CardIds.SplittingImage_TRL_400);
			secretsWeCantRuleOut.push(CardIds.OasisAlly);
			secretsWeCantRuleOut.push(CardIds.AutodefenseMatrix_BOT_908);
			secretsWeCantRuleOut.push(CardIds.Bamboozle);
			if (enemyBoard.length === 1) {
				secretsWeCantRuleOut.push(CardIds.SuddenBetrayal);
			}
		}
		if (isDefenderMinion) {
			secretsWeCantRuleOut.push(CardIds.BearTrap);
			secretsWeCantRuleOut.push(CardIds.MisdirectionLegacy);
			secretsWeCantRuleOut.push(CardIds.MisdirectionVanilla);
			secretsWeCantRuleOut.push(CardIds.BeaststalkerTavish_ImprovedExplosiveTrapToken);
			secretsWeCantRuleOut.push(CardIds.ExplosiveTrapLegacy_EX1_610);
			secretsWeCantRuleOut.push(CardIds.ExplosiveTrapCore);
			secretsWeCantRuleOut.push(CardIds.ExplosiveTrapVanilla);
			secretsWeCantRuleOut.push(CardIds.WanderingMonsterCore);
			secretsWeCantRuleOut.push(CardIds.WanderingMonster);
			secretsWeCantRuleOut.push(CardIds.FlameWard);
			secretsWeCantRuleOut.push(CardIds.IceBarrierLegacy);
			secretsWeCantRuleOut.push(CardIds.IceBarrierCore);
			secretsWeCantRuleOut.push(CardIds.IceBarrierVanilla);
			secretsWeCantRuleOut.push(CardIds.VaporizeLegacy);
			secretsWeCantRuleOut.push(CardIds.VaporizeVanilla);
			secretsWeCantRuleOut.push(CardIds.ShadowClone);
			secretsWeCantRuleOut.push(CardIds.SuddenBetrayal);
			secretsWeCantRuleOut.push(CardIds.VengefulVisage);
			if (isDefenderDivineShield) {
				secretsWeCantRuleOut.push(CardIds.AutodefenseMatrix_BOT_908);
			}
		}

		const allEntities = [
			gameEvent.gameState.Player.Hero,
			...gameEvent.gameState.Player.Board,
			gameEvent.gameState.Opponent.Hero,
			...gameEvent.gameState.Opponent.Board,
		];
		const otherTargets = allEntities.filter((entity) => [attackerId, defenderId].indexOf(entity.entityId) === -1);

		// Misdirection only triggers if there is another entity on the board that can be attacked
		if (otherTargets.length === 0) {
			secretsWeCantRuleOut.push(CardIds.MisdirectionLegacy);
			secretsWeCantRuleOut.push(CardIds.MisdirectionVanilla);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnAttack.filter(
			(secret) => secretsWeCantRuleOut.indexOf(secret) === -1,
		);

		let secrets: BoardSecret[] = [...deckWithSecretToCheck.secrets];
		for (const secret of optionsToFlagAsInvalid) {
			secrets = secrets.map((boardSecret) => {
				if (isSecretToBeConsidered(deckWithSecretToCheck, boardSecret)) {
					return this.helper.removeSecretOptionFromSecret(boardSecret, secret);
				}
				return boardSecret;
			});
			// secrets = [...this.helper.removeSecretOptionFromSecrets(secrets, secret)];
		}
		const newPlayerDeck = deckWithSecretToCheck.update({
			secrets: secrets as readonly BoardSecret[],
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayerTheAttackedParty ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_ATTACK';
	}
}
