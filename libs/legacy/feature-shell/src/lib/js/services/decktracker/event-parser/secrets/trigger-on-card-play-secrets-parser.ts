import { CardIds } from '@firestone-hs/reference-data';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { COUNTERSPELLS } from '../../../hs-utils';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnCardPlaySecretsParser implements EventParser {
	private secretsTriggeringOnCardPlayed = [CardIds.AzeriteVein_WW_422];

	private secretWillTrigger: {
		cardId: string;
		reactingToCardId: string;
		reactingToEntityId: number;
	};

	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return (
			state &&
			gameEvent.gameState &&
			(gameEvent.type === GameEvent.CARD_PLAYED ||
				gameEvent.type === GameEvent.SECRET_PLAYED ||
				gameEvent.type === GameEvent.QUEST_PLAYED)
		);
	}

	async parse(
		currentState: GameState,
		gameEvent: GameEvent,
		additionalInfo?: {
			secretWillTrigger: {
				cardId: string;
				reactingToCardId: string;
				reactingToEntityId: number;
			};
			minionsWillDie: readonly {
				cardId: string;
				entityId: number;
			}[];
		},
	): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		if (!cardId) {
			console.warn('[trigger-on-spell-play] no card Id', gameEvent.parse());
			return currentState;
		}

		this.secretWillTrigger = additionalInfo?.secretWillTrigger;
		// If a counterspell has been triggered, the other secrets won't trigger
		if (
			COUNTERSPELLS.includes(this.secretWillTrigger?.cardId as CardIds) &&
			gameEvent.cardId === this.secretWillTrigger?.reactingToCardId
		) {
			console.log('[trigger-on-spell-play] counterspell triggered, no secrets will trigger');
			return currentState;
		}

		const isCardPlayedByPlayer = controllerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isCardPlayedByPlayer ? currentState.opponentDeck : currentState.playerDeck;

		const secretsWeCantRuleOut = [];

		const cardPlayed = deckWithSecretToCheck.findCard(entityId);
		const turnEnteredHand = cardPlayed?.card?.metaInfo?.turnAtWhichCardEnteredHand;
		const currentTurn = currentState.currentTurn;

		if (turnEnteredHand !== currentTurn) {
			secretsWeCantRuleOut.push(CardIds.AzeriteVein_WW_422);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnCardPlayed.filter(
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
			[isCardPlayedByPlayer ? 'opponentDeck' : 'playerDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_CARD_PLAYED';
	}
}
