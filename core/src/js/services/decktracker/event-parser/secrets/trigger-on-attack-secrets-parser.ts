import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
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
		CardIds.SnakeTrapLegacy,
		CardIds.SnakeTrapCore,
		CardIds.SnakeTrapVanilla,
		CardIds.PackTactics,
		CardIds.ExplosiveTrapLegacy,
		CardIds.ExplosiveTrapCore,
		CardIds.ExplosiveTrapVanilla,
		CardIds.FreezingTrapLegacy,
		CardIds.FreezingTrapCore,
		CardIds.FreezingTrapVanilla,
		CardIds.VenomstrikeTrap1,
		CardIds.WanderingMonster,
		CardIds.FlameWard,
		CardIds.IceBarrierLegacy,
		CardIds.IceBarrierCore,
		CardIds.IceBarrierVanilla,
		CardIds.OasisAlly,
		CardIds.SplittingImage1,
		CardIds.VaporizeLegacy,
		CardIds.VaporizeVanilla,
		CardIds.AutodefenseMatrix1,
		CardIds.NobleSacrificeCore,
		CardIds.NobleSacrificeCore,
		CardIds.NobleSacrificeVanilla,
		CardIds.JudgmentOfJustice,
		CardIds.Bamboozle,
		CardIds.ShadowClone,
		CardIds.SuddenBetrayal,
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
		// if (this.secretsTriggeringOnAttack.indexOf(gameEvent.cardId) === -1) {
		// 	return currentState;
		// }
		// // console.warn('TODO: remove older secrets that didnt trigger even though the conditions were met');
		// const isSecretToBeConsidered = (deck: DeckState, secret: BoardSecret): boolean => {
		// 	const indexOfTriggeredSecret = deck.secrets.map(secret => secret.entityId).indexOf(gameEvent.entityId);
		// 	const indexOfCurrentSecret = deck.secrets.map(secret => secret.entityId).indexOf(secret.entityId);
		// 	return indexOfCurrentSecret < indexOfTriggeredSecret;
		// };
		// return this.handleAttack(currentState, gameEvent, isSecretToBeConsidered);
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
			// console.log('attacker and defender are the same', gameEvent);
			return currentState;
		}

		const isPlayerTheAttackedParty = defenderControllerId === gameEvent.localPlayer.PlayerId;
		const activePlayerId = gameEvent.gameState.ActivePlayerId;
		const deckWithSecretToCheck = isPlayerTheAttackedParty ? currentState.playerDeck : currentState.opponentDeck;
		if (isPlayerTheAttackedParty && activePlayerId === gameEvent.localPlayer.PlayerId) {
			// console.log('active player is attacked', gameEvent);
			return currentState;
		}
		if (!isPlayerTheAttackedParty && activePlayerId === gameEvent.opponentPlayer.PlayerId) {
			// console.log('active opponent is attacked', gameEvent);
			return currentState;
		}

		// console.log('deck to check', deckWithSecretToCheck);
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
		// console.log('attacker minion?', isAttackerMinion, 'defender minion?', isDefenderMinion, gameEvent);
		const enemyBoard = (isPlayerTheAttackedParty ? currentState.opponentDeck : currentState.playerDeck).board;

		const secretsWeCantRuleOut = [];
		if (isBoardFull) {
			secretsWeCantRuleOut.push(CardIds.BearTrap);
			secretsWeCantRuleOut.push(CardIds.SnakeTrapLegacy);
			secretsWeCantRuleOut.push(CardIds.SnakeTrapCore);
			secretsWeCantRuleOut.push(CardIds.SnakeTrapVanilla);
			secretsWeCantRuleOut.push(CardIds.PackTactics);
			secretsWeCantRuleOut.push(CardIds.SplittingImage1);
			secretsWeCantRuleOut.push(CardIds.OasisAlly);
			secretsWeCantRuleOut.push(CardIds.NobleSacrificeLegacy);
			secretsWeCantRuleOut.push(CardIds.NobleSacrificeCore);
			secretsWeCantRuleOut.push(CardIds.NobleSacrificeVanilla);
			secretsWeCantRuleOut.push(CardIds.ShadowClone);
		}
		if (!isAttackerMinion) {
			secretsWeCantRuleOut.push(CardIds.FreezingTrapLegacy);
			secretsWeCantRuleOut.push(CardIds.FreezingTrapCore);
			secretsWeCantRuleOut.push(CardIds.FreezingTrapVanilla);
			secretsWeCantRuleOut.push(CardIds.VaporizeLegacy);
			secretsWeCantRuleOut.push(CardIds.VaporizeVanilla);
			secretsWeCantRuleOut.push(CardIds.FlameWard);
			secretsWeCantRuleOut.push(CardIds.JudgmentOfJustice);
			secretsWeCantRuleOut.push(CardIds.SuddenBetrayal);
			secretsWeCantRuleOut.push(CardIds.ShadowClone);
		}
		if (!isDefenderMinion) {
			secretsWeCantRuleOut.push(CardIds.SnakeTrapLegacy);
			secretsWeCantRuleOut.push(CardIds.SnakeTrapCore);
			secretsWeCantRuleOut.push(CardIds.SnakeTrapVanilla);
			secretsWeCantRuleOut.push(CardIds.PackTactics);
			secretsWeCantRuleOut.push(CardIds.VenomstrikeTrap1);
			secretsWeCantRuleOut.push(CardIds.SplittingImage1);
			secretsWeCantRuleOut.push(CardIds.OasisAlly);
			secretsWeCantRuleOut.push(CardIds.AutodefenseMatrix1);
			secretsWeCantRuleOut.push(CardIds.Bamboozle);
			if (enemyBoard.length === 1) {
				secretsWeCantRuleOut.push(CardIds.SuddenBetrayal);
			}
		}
		if (isDefenderMinion) {
			secretsWeCantRuleOut.push(CardIds.BearTrap);
			secretsWeCantRuleOut.push(CardIds.MisdirectionLegacy);
			secretsWeCantRuleOut.push(CardIds.MisdirectionVanilla);
			secretsWeCantRuleOut.push(CardIds.ExplosiveTrapLegacy);
			secretsWeCantRuleOut.push(CardIds.ExplosiveTrapCore);
			secretsWeCantRuleOut.push(CardIds.ExplosiveTrapVanilla);
			secretsWeCantRuleOut.push(CardIds.WanderingMonster);
			secretsWeCantRuleOut.push(CardIds.FlameWard);
			secretsWeCantRuleOut.push(CardIds.IceBarrierLegacy);
			secretsWeCantRuleOut.push(CardIds.IceBarrierCore);
			secretsWeCantRuleOut.push(CardIds.IceBarrierVanilla);
			secretsWeCantRuleOut.push(CardIds.VaporizeLegacy);
			secretsWeCantRuleOut.push(CardIds.VaporizeVanilla);
			secretsWeCantRuleOut.push(CardIds.ShadowClone);
			secretsWeCantRuleOut.push(CardIds.SuddenBetrayal);
			if (isDefenderDivineShield) {
				secretsWeCantRuleOut.push(CardIds.AutodefenseMatrix1);
			}
		}
		// console.log('considering secret', isDefenderMinion, isDefenderDivineShield, gameEvent);
		const allEntities = [
			gameEvent.gameState.Player.Hero,
			...gameEvent.gameState.Player.Board,
			gameEvent.gameState.Opponent.Hero,
			...gameEvent.gameState.Opponent.Board,
		];
		const otherTargets = allEntities.filter((entity) => [attackerId, defenderId].indexOf(entity.entityId) === -1);
		// console.log('other targets', otherTargets, allEntities, attackerId, defenderId);
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
			// console.log('marking as invalid', secret, secrets);
			secrets = secrets.map((boardSecret) => {
				if (isSecretToBeConsidered(deckWithSecretToCheck, boardSecret)) {
					return this.helper.removeSecretOptionFromSecret(boardSecret, secret);
				}
				return boardSecret;
			});
			// secrets = [...this.helper.removeSecretOptionFromSecrets(secrets, secret)];
			// console.log('marked as invalid', secret, newPlayerDeck);
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
