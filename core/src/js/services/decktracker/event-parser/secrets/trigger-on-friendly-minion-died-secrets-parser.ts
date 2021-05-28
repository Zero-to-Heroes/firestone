import { CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { MinionsDiedEvent } from '../../../../models/mainwindow/game-events/minions-died-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnFriendlyMinionDiedSecretsParser implements EventParser {
	private secretsTriggeringOnFriendlyMinionDeath = [
		CardIds.Collectible.Mage.Effigy1,
		CardIds.Collectible.Mage.Duplicate,
		CardIds.Collectible.Paladin.GetawayKodo,
		CardIds.Collectible.Paladin.RedemptionLegacy,
		CardIds.Collectible.Paladin.RedemptionVanilla,
		CardIds.Collectible.Paladin.Avenge1,
		CardIds.Collectible.Paladin.AvengeCore,
		CardIds.Collectible.Rogue.CheatDeath,
	];

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.gameState && gameEvent.type === GameEvent.MINIONS_DIED;
	}

	async parse(currentState: GameState, gameEvent: MinionsDiedEvent): Promise<GameState> {
		//console.debug('considering event', gameEvent);
		const [, , localPlayer] = gameEvent.parse();
		const activePlayerId = gameEvent.gameState.ActivePlayerId;

		const deadEnemyMinions = gameEvent.additionalData.deadMinions.filter(
			(deadMinion) => deadMinion.ControllerId !== activePlayerId,
		);
		//console.debug('deadEnemyMinions', deadEnemyMinions, gameEvent);
		if (!deadEnemyMinions?.length) {
			return currentState;
		}

		const isPlayerWithDeadMinion = deadEnemyMinions[0].ControllerId === localPlayer.PlayerId;
		//console.debug('isPlayerWithDeadMinion', isPlayerWithDeadMinion);
		const deckWithSecretToCheck = isPlayerWithDeadMinion ? currentState.playerDeck : currentState.opponentDeck;
		//console.debug('deckWithSecretToCheck', deckWithSecretToCheck);
		const secretsWeCantRuleOut = [];

		// TODO: handle the case where the max hand size has been bumped to 12
		const isHandFull = deckWithSecretToCheck.hand.length >= 10;
		if (isHandFull) {
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.Duplicate);
			secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.GetawayKodo);
			secretsWeCantRuleOut.push(CardIds.Collectible.Rogue.CheatDeath);
		}

		// If it's the only minion on board, we trigger nothing
		if (deckWithSecretToCheck.board.filter((entity) => !entity.dormant).length === deadEnemyMinions.length) {
			secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.Avenge1);
			secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.AvengeCore);
		}
		// TODO: Redemption will not trigger if deathrattles fill up the board

		const optionsToFlagAsInvalid = this.secretsTriggeringOnFriendlyMinionDeath.filter(
			(secret) => secretsWeCantRuleOut.indexOf(secret) === -1,
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
			[isPlayerWithDeadMinion ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_FRIENDLY_MINION_DEATH';
	}
}
