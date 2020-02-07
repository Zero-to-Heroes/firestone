import { CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnDamageSecretsParser implements EventParser {
	private secretsTriggeringOnDamage = [CardIds.Collectible.Paladin.EyeForAnEye, CardIds.Collectible.Rogue.Evasion];

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.DAMAGE;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, , localPlayer] = gameEvent.parse();
		const sourceControllerId = gameEvent.additionalData.sourceControllerId;
		const activePlayerId = gameEvent.gameState.ActivePlayerId;

		const isPlayerActive = activePlayerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayerActive ? currentState.opponentDeck : currentState.playerDeck;
		const enemyHeroEntityId = isPlayerActive
			? gameEvent.gameState.Opponent.Hero.entityId
			: gameEvent.gameState.Player.Hero.entityId;
		const heroTarget = gameEvent.additionalData.targets
			? Object.values(gameEvent.additionalData.targets).find(
					(target: any) => target.TargetEntityId === enemyHeroEntityId,
			  )
			: null;

		const secretsWeCantRuleOut = [];

		if (!heroTarget) {
			secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.EyeForAnEye);
			secretsWeCantRuleOut.push(CardIds.Collectible.Rogue.Evasion);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnDamage.filter(
			secret => secretsWeCantRuleOut.indexOf(secret) === -1,
		);

		let secrets: BoardSecret[] = [...deckWithSecretToCheck.secrets];
		for (const secret of optionsToFlagAsInvalid) {
			console.log('marking as invalid', secret, secrets);
			secrets = [...this.helper.removeSecretOptionFromSecrets(secrets, secret)];
			// console.log('marked as invalid', secret, newPlayerDeck);
		}
		let newPlayerDeck = deckWithSecretToCheck.update({
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
