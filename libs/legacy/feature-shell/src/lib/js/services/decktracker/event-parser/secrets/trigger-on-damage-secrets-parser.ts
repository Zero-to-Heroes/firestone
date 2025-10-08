import { CardIds } from '@firestone-hs/reference-data';
import { BoardSecret, DamageGameEvent, DeckState, GameEvent, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { EventParser } from '../_event-parser';
import { DeckManipulationHelper } from '../deck-manipulation-helper';

export class TriggerOnDamageSecretsParser implements EventParser {
	private secretsTriggeringOnDamage = [
		CardIds.EyeForAnEyeLegacy,
		CardIds.EyeForAnEyeVanilla,
		CardIds.ReckoningLegacy,
		CardIds.Reckoning_CORE_CS3_016,
		CardIds.Evasion,
	];

	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.DAMAGE;
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
		const [, , localPlayer] = gameEvent.parse();
		//const sourceControllerId = gameEvent.additionalData.sourceControllerId;
		const activePlayerId = gameEvent.additionalData.activePlayerId;

		if (!localPlayer || activePlayerId == null) {
			console.error(
				'[secrets-parser] cannot rule out secrets without local player id or active player id',
				localPlayer,
				activePlayerId,
			);
		}

		const isPlayerActive = activePlayerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayerActive ? currentState.opponentDeck : currentState.playerDeck;

		const secretsWeCantRuleOut = [];

		const isEnemyDealing = isPlayerActive
			? gameEvent.additionalData.sourceControllerId === localPlayer.PlayerId
			: gameEvent.additionalData.sourceControllerId !== localPlayer.PlayerId;
		if (!isEnemyDealing) {
			secretsWeCantRuleOut.push(CardIds.Reckoning_CORE_CS3_016);
			secretsWeCantRuleOut.push(CardIds.ReckoningLegacy);
		} else {
			const sourceCard = this.allCards.getCard(gameEvent.additionalData.sourceCardId);

			if (sourceCard?.type !== 'Minion') {
				secretsWeCantRuleOut.push(CardIds.Reckoning_CORE_CS3_016);
				secretsWeCantRuleOut.push(CardIds.ReckoningLegacy);
			} else {
				const dealingEntityId = gameEvent.additionalData.sourceEntityId;
				// If the minion dealing damage dies in the process, we can't rule out Reckoning
				if (additionalInfo?.minionsWillDie?.map((minion) => minion.entityId)?.includes(dealingEntityId)) {
					secretsWeCantRuleOut.push(CardIds.Reckoning_CORE_CS3_016);
					secretsWeCantRuleOut.push(CardIds.ReckoningLegacy);
				}
				const maxDamage = Math.max(
					...Object.values(gameEvent.additionalData.targets).map((target) => target.Damage),
				);
				if (maxDamage < 3) {
					secretsWeCantRuleOut.push(CardIds.Reckoning_CORE_CS3_016);
					secretsWeCantRuleOut.push(CardIds.ReckoningLegacy);
				}
			}
		}

		const enemyHeroEntityId = isPlayerActive
			? currentState.opponentDeck?.hero?.entityId
			: currentState.playerDeck?.hero?.entityId;
		const heroTarget = gameEvent.additionalData.targets
			? Object.values(gameEvent.additionalData.targets).find(
					(target) => target.TargetEntityId === enemyHeroEntityId,
				)
			: null;
		if (!heroTarget) {
			secretsWeCantRuleOut.push(CardIds.EyeForAnEyeLegacy);
			secretsWeCantRuleOut.push(CardIds.EyeForAnEyeVanilla);
			secretsWeCantRuleOut.push(CardIds.Evasion);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnDamage.filter(
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
			[isPlayerActive ? 'opponentDeck' : 'playerDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_DAMAGE';
	}
}
