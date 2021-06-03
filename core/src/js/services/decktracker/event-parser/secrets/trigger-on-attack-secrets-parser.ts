import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

// https://hearthstone.gamepedia.com/Advanced_rulebook#Combat
export class TriggerOnAttackSecretsParser implements EventParser {
	private secretsTriggeringOnAttack = [
		CardIds.Collectible.Hunter.BearTrap,
		CardIds.Collectible.Hunter.MisdirectionLegacy,
		CardIds.Collectible.Hunter.MisdirectionVanilla,
		CardIds.Collectible.Hunter.SnakeTrapLegacy,
		CardIds.Collectible.Hunter.SnakeTrapCore,
		CardIds.Collectible.Hunter.SnakeTrapVanilla,
		CardIds.Collectible.Hunter.PackTactics,
		CardIds.Collectible.Hunter.ExplosiveTrapLegacy,
		CardIds.Collectible.Hunter.ExplosiveTrapCore,
		CardIds.Collectible.Hunter.ExplosiveTrapVanilla,
		CardIds.Collectible.Hunter.FreezingTrapLegacy,
		CardIds.Collectible.Hunter.FreezingTrapCore,
		CardIds.Collectible.Hunter.FreezingTrapVanilla,
		CardIds.Collectible.Hunter.VenomstrikeTrap1,
		CardIds.Collectible.Hunter.WanderingMonster,
		CardIds.Collectible.Mage.FlameWard,
		CardIds.Collectible.Mage.IceBarrierLegacy,
		CardIds.Collectible.Mage.IceBarrierCore,
		CardIds.Collectible.Mage.IceBarrierVanilla,
		CardIds.Collectible.Mage.OasisAlly,
		CardIds.Collectible.Mage.SplittingImage1,
		CardIds.Collectible.Mage.VaporizeLegacy,
		CardIds.Collectible.Mage.VaporizeVanilla,
		CardIds.Collectible.Paladin.AutodefenseMatrix1,
		CardIds.Collectible.Paladin.NobleSacrificeCore,
		CardIds.Collectible.Paladin.NobleSacrificeCore,
		CardIds.Collectible.Paladin.NobleSacrificeVanilla,
		CardIds.Collectible.Paladin.JudgmentOfJustice,
		CardIds.Collectible.Rogue.Bamboozle,
		CardIds.Collectible.Rogue.ShadowClone,
		CardIds.Collectible.Rogue.SuddenBetrayal,
	];

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

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
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.BearTrap);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.SnakeTrapLegacy);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.SnakeTrapCore);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.SnakeTrapVanilla);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.PackTactics);
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.SplittingImage1);
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.OasisAlly);
			secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.NobleSacrificeLegacy);
			secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.NobleSacrificeCore);
			secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.NobleSacrificeVanilla);
			secretsWeCantRuleOut.push(CardIds.Collectible.Rogue.ShadowClone);
		}
		if (!isAttackerMinion) {
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.FreezingTrapLegacy);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.FreezingTrapCore);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.FreezingTrapVanilla);
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.VaporizeLegacy);
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.VaporizeVanilla);
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.FlameWard);
			secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.JudgmentOfJustice);
			secretsWeCantRuleOut.push(CardIds.Collectible.Rogue.SuddenBetrayal);
			secretsWeCantRuleOut.push(CardIds.Collectible.Rogue.ShadowClone);
		}
		if (!isDefenderMinion) {
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.SnakeTrapLegacy);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.SnakeTrapCore);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.SnakeTrapVanilla);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.PackTactics);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.VenomstrikeTrap1);
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.SplittingImage1);
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.OasisAlly);
			secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.AutodefenseMatrix1);
			secretsWeCantRuleOut.push(CardIds.Collectible.Rogue.Bamboozle);
			if (enemyBoard.length === 1) {
				secretsWeCantRuleOut.push(CardIds.Collectible.Rogue.SuddenBetrayal);
			}
		}
		if (isDefenderMinion) {
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.BearTrap);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.MisdirectionLegacy);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.MisdirectionVanilla);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.ExplosiveTrapLegacy);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.ExplosiveTrapCore);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.ExplosiveTrapVanilla);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.WanderingMonster);
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.FlameWard);
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.IceBarrierLegacy);
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.IceBarrierCore);
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.IceBarrierVanilla);
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.VaporizeLegacy);
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.VaporizeVanilla);
			secretsWeCantRuleOut.push(CardIds.Collectible.Rogue.ShadowClone);
			secretsWeCantRuleOut.push(CardIds.Collectible.Rogue.SuddenBetrayal);
			if (isDefenderDivineShield) {
				secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.AutodefenseMatrix1);
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
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.MisdirectionLegacy);
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.MisdirectionVanilla);
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
