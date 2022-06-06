import { CardIds } from '@firestone-hs/reference-data';
import { BoardSecret } from '../../../models/decktracker/board-secret';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { SecretOption } from '../../../models/decktracker/secret-option';
import { GameEvent } from '../../../models/game-event';
import { CopiedFromEntityIdGameEvent } from '../../../models/mainwindow/game-events/copied-from-entity-id-game-event';
import { forcedHiddenCardCreators } from '../../hs-utils';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CopiedFromEntityIdParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly i18n: LocalizationFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.COPIED_FROM_ENTITY_ID;
	}

	async parse(currentState: GameState, gameEvent: CopiedFromEntityIdGameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const copiedCardEntityId = gameEvent.additionalData.copiedCardEntityId;
		const copiedCardControllerId = gameEvent.additionalData.copiedCardControllerId;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const isCopiedPlayer = copiedCardControllerId === localPlayer.PlayerId;
		const copiedDeck = isCopiedPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const newCopy: DeckCard = deck.findCard(entityId);
		const copiedCard: DeckCard = copiedDeck.findCard(copiedCardEntityId);

		if (!copiedCard) {
			return currentState;
		}

		const updatedCardId = newCopy?.cardId ?? copiedCard.cardId;
		// Otherwise cards revealed by Coilfang Constrictor are flagged in hand very precisely, while we shouldn't have this
		// kind of granular information
		// Also, simply hiding the information
		const obfuscatedCardId =
			forcedHiddenCardCreators.includes(newCopy.lastAffectedByCardId as CardIds) ||
			forcedHiddenCardCreators.includes(newCopy.creatorCardId as CardIds)
				? copiedCard.cardId
				: updatedCardId;
		console.debug(
			'obfuscatedCardId',
			obfuscatedCardId,
			copiedCard,
			newCopy,
			forcedHiddenCardCreators,
			updatedCardId,
			gameEvent,
		);
		const updatedCopiedCard = copiedCard.update({
			cardId: obfuscatedCardId,
			cardName: this.i18n.getCardName(obfuscatedCardId, copiedCard.cardId),
		} as DeckCard);
		const newCopiedDeck = this.helper.updateCardInDeck(copiedDeck, updatedCopiedCard);

		// Also update the secrets
		const copiedDeckWithSecrets: DeckState = this.updateSecrets(
			newCopiedDeck,
			updatedCopiedCard.cardId,
			copiedCardEntityId,
		);

		return Object.assign(new GameState(), currentState, {
			[isCopiedPlayer ? 'playerDeck' : 'opponentDeck']: copiedDeckWithSecrets,
		});
	}

	private updateSecrets(deck: DeckState, cardId: string, copiedCardEntityId: number): DeckState {
		return deck.update({
			secrets: deck.secrets.map((secret) =>
				secret.entityId === copiedCardEntityId
					? secret.update({
							cardId: cardId,
							allPossibleOptions: secret.allPossibleOptions.map((option) =>
								option.cardId === cardId
									? option.update({ ...option, isValidOption: true } as SecretOption)
									: option.update({ ...option, isValidOption: false } as SecretOption),
							) as readonly SecretOption[],
					  } as BoardSecret)
					: secret,
			) as readonly BoardSecret[],
		} as DeckState);
	}

	event(): string {
		return GameEvent.COPIED_FROM_ENTITY_ID;
	}
}
