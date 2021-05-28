import { CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DamageGameEvent } from '../../../../models/mainwindow/game-events/damage-game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnDamageSecretsParser implements EventParser {
	private secretsTriggeringOnDamage = [
		CardIds.Collectible.Paladin.EyeForAnEyeLegacy,
		CardIds.Collectible.Paladin.EyeForAnEyeVanilla,
		CardIds.Collectible.Paladin.ReckoningCore,
		CardIds.Collectible.Rogue.Evasion,
	];

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.gameState && gameEvent.type === GameEvent.DAMAGE;
	}

	async parse(
		currentState: GameState,
		gameEvent: DamageGameEvent,
		additionalInfo?: {
			secretWillTrigger?: {
				cardId: string;
				reactingToCardId: string;
				reactingToEntityId: number;
			};
			minionsWillDie?: readonly {
				cardId: string;
				entityId: number;
			}[];
		},
	): Promise<GameState> {
		//console.debug('[secrets-parser] considering event', gameEvent);
		const [, , localPlayer] = gameEvent.parse();
		//const sourceControllerId = gameEvent.additionalData.sourceControllerId;
		const activePlayerId = gameEvent.gameState.ActivePlayerId;

		const isPlayerActive = activePlayerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayerActive ? currentState.opponentDeck : currentState.playerDeck;
		//console.debug('[secrets-parser] deckWithSecretToCheck', deckWithSecretToCheck, isPlayerActive);

		const secretsWeCantRuleOut = [];

		const isEnemyDealing = isPlayerActive
			? gameEvent.additionalData.sourceControllerId === localPlayer?.PlayerId
			: gameEvent.additionalData.sourceControllerId !== localPlayer?.PlayerId;
		//console.debug('[secrets-parser] is enemy dealing?', isEnemyDealing, isPlayerActive, gameEvent);
		if (!isEnemyDealing) {
			secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.ReckoningCore);
		} else {
			const sourceCard = this.allCards.getCard(gameEvent.additionalData.sourceCardId);
			//console.debug('[secrets-parser] enmy is dealing from source', sourceCard);

			if (sourceCard?.type !== 'Minion') {
				secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.ReckoningCore);
			} else {
				const dealingEntityId = gameEvent.additionalData.sourceEntityId;
				// If the minion dealing damage dies in the process, we can't rule out Reckoning
				if (additionalInfo?.minionsWillDie?.map((minion) => minion.entityId)?.includes(dealingEntityId)) {
					secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.ReckoningCore);
				}
				const maxDamage = Math.max(
					...Object.values(gameEvent.additionalData.targets).map((target) => target.Damage),
				);
				//console.debug('[secrets-parser] source is minion with damage', maxDamage);
				if (maxDamage < 3) {
					secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.ReckoningCore);
				}
			}
		}

		const enemyHeroEntityId = isPlayerActive
			? gameEvent.gameState.Opponent.Hero.entityId
			: gameEvent.gameState.Player.Hero.entityId;
		const heroTarget = gameEvent.additionalData.targets
			? Object.values(gameEvent.additionalData.targets).find(
					(target) => target.TargetEntityId === enemyHeroEntityId,
			  )
			: null;
		if (!heroTarget) {
			secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.EyeForAnEyeLegacy);
			secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.EyeForAnEyeVanilla);
			secretsWeCantRuleOut.push(CardIds.Collectible.Rogue.Evasion);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnDamage.filter(
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
			[isPlayerActive ? 'opponentDeck' : 'playerDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_DAMAGE';
	}
}
