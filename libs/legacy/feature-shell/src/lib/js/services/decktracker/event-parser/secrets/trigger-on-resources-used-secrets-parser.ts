import { CardIds } from '@firestone-hs/reference-data';
import { BoardSecret, DeckState, GameEvent, GameState } from '@firestone/game-state';
import { EventParser } from '../_event-parser';
import { DeckManipulationHelper } from '../deck-manipulation-helper';

export class TriggerOnResourcesUsedSecretsParser implements EventParser {
	private secretsTriggeringOnResourcesUsed = [CardIds.DoubleCross];

	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.RESOURCES_UPDATED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const isPlayerTheOneWhoUsedResources = controllerId === localPlayer?.PlayerId;

		const deckWithSecretToCheck = isPlayerTheOneWhoUsedResources
			? currentState.opponentDeck
			: currentState.playerDeck;

		const secretsWeCantRuleOut = [];

		const areResourcesFullyUsed = gameEvent.additionalData.resourcesLeft === 0;
		if (!areResourcesFullyUsed) {
			secretsWeCantRuleOut.push(CardIds.DoubleCross);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnResourcesUsed.filter(
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
			[isPlayerTheOneWhoUsedResources ? 'opponentDeck' : 'playerDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_RESOURCES_USED';
	}
}
