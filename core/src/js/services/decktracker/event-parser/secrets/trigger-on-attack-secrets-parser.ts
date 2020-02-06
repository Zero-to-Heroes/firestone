import { CardIds, CardType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

// https://hearthstone.gamepedia.com/Advanced_rulebook#Combat
export class TriggerOnAttackSecretsParser implements EventParser {
	private secretsTriggeringOnAttack = [
		CardIds.Collectible.Hunter.BearTrap,
		CardIds.Collectible.Hunter.Misdirection,
		CardIds.Collectible.Hunter.SnakeTrap,
		CardIds.Collectible.Hunter.ExplosiveTrap,
		CardIds.Collectible.Hunter.FreezingTrap,
		CardIds.Collectible.Hunter.VenomstrikeTrap,
		CardIds.Collectible.Hunter.WanderingMonster,
	];

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && (gameEvent.type === GameEvent.ATTACKING_HERO || gameEvent.type === GameEvent.ATTACKING_MINION);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const attackerId = gameEvent.additionalData.attackerEntityId;
		const defenderId = gameEvent.additionalData.defenderEntityId;
		const defenderControllerId = gameEvent.additionalData.defenderControllerId;
		const attackerControllerId = gameEvent.additionalData.attackerControllerId;
		if (defenderControllerId === attackerControllerId) {
			console.log('attacker and defender are the same', gameEvent);
			return currentState;
		}

		const isPlayerTheAttackedParty = defenderControllerId === gameEvent.localPlayer.PlayerId;
		const activePlayerId = gameEvent.gameState.ActivePlayerId;
		const deckWithSecretToCheck = isPlayerTheAttackedParty ? currentState.playerDeck : currentState.opponentDeck;
		if (isPlayerTheAttackedParty && activePlayerId === gameEvent.localPlayer.PlayerId) {
			console.log('active player is attacked', gameEvent);
			return currentState;
		}
		if (!isPlayerTheAttackedParty && activePlayerId === gameEvent.opponentPlayer.PlayerId) {
			console.log('active opponent is attacked', gameEvent);
			return currentState;
		}

		console.log('deck to check', deckWithSecretToCheck);
		let newPlayerDeck = deckWithSecretToCheck;
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
		console.log('attacker minion?', isAttackerMinion, 'defender minion?', isDefenderMinion, gameEvent);
		const toExclude = [];
		if (isBoardFull) {
			toExclude.push(CardIds.Collectible.Hunter.BearTrap);
			toExclude.push(CardIds.Collectible.Hunter.SnakeTrap);
		}
		if (!isAttackerMinion) {
			toExclude.push(CardIds.Collectible.Hunter.FreezingTrap);
		}
		if (!isDefenderMinion) {
			toExclude.push(CardIds.Collectible.Hunter.SnakeTrap);
			toExclude.push(CardIds.Collectible.Hunter.VenomstrikeTrap);
		}
		if (isDefenderMinion) {
			toExclude.push(CardIds.Collectible.Hunter.BearTrap);
			toExclude.push(CardIds.Collectible.Hunter.Misdirection);
			toExclude.push(CardIds.Collectible.Hunter.ExplosiveTrap);
			toExclude.push(CardIds.Collectible.Hunter.WanderingMonster);
		}
		const allEntities = [
			gameEvent.gameState.Player.Hero,
			...gameEvent.gameState.Player.Board,
			gameEvent.gameState.Opponent.Hero,
			...gameEvent.gameState.Opponent.Board,
		];
		const otherTargets = allEntities.filter(entity => [attackerId, defenderId].indexOf(entity.entityId) === -1);
		console.log('other targets', otherTargets, allEntities, attackerId, defenderId);
		// Misdirection only triggers if there is another entity on the board that can be attacked
		if (otherTargets.length === 0) {
			toExclude.push(CardIds.Collectible.Hunter.Misdirection);
		}
		const optionsToFlagAsInvalid = this.secretsTriggeringOnAttack.filter(
			secret => toExclude.indexOf(secret) === -1,
		);
		for (const secret of optionsToFlagAsInvalid) {
			console.log('marking as invalid', secret, newPlayerDeck);
			newPlayerDeck = this.helper.removeSecretOption(newPlayerDeck, secret);
			// console.log('marked as invalid', secret, newPlayerDeck);
		}
		return Object.assign(new GameState(), currentState, {
			[isPlayerTheAttackedParty ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_BEAR_TRAP';
	}
}
