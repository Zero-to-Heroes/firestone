import { CardIds, Zone } from '@firestone-hs/reference-data';
import { BoardSecret } from '../../../models/decktracker/board-secret';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { SecretOption } from '../../../models/decktracker/secret-option';
import { GameEvent } from '../../../models/game-event';
import { CopiedFromEntityIdGameEvent } from '../../../models/mainwindow/game-events/copied-from-entity-id-game-event';
import { forcedHiddenCardCreators, hideInfoWhenPlayerPlaysIt } from '../../hs-utils';
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
		const copiedCardZone = gameEvent.additionalData.copiedCardZone;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const isCopiedPlayer = copiedCardControllerId === localPlayer.PlayerId;
		const copiedDeck = isCopiedPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const newCopy: DeckCard = deck.findCard(entityId)?.card;
		const copiedCard: DeckCard = copiedDeck.findCard(copiedCardEntityId)?.card;
		console.debug('copiedCard', isPlayer, copiedCard, newCopy, copiedDeck, copiedCardEntityId, gameEvent, deck);

		// Cards like Masked Reveler summon a copy of a card from the deck. Because we don't store the entityId of
		// unknown cards in deck (to avoid info leaks), we can't find the right card from the event info, and so
		// we can't decide to update the card in the deck.
		// However, we can still use that zone information to create an empty card in the zone, so that we know that
		// the card might be inside their deck (though we don't want to store the entityId, because that would leak to
		// info leaks)

		// if (!copiedCard) {
		// 	return currentState;
		// }

		const updatedCardId = newCopy?.cardId ?? copiedCard?.cardId;
		// See receive-card-in-hand-parser
		const shouldObfuscate =
			(isPlayer &&
				(forcedHiddenCardCreators.includes(newCopy?.lastAffectedByCardId as CardIds) ||
					forcedHiddenCardCreators.includes(newCopy?.creatorCardId as CardIds))) ||
			(!isPlayer &&
				(hideInfoWhenPlayerPlaysIt.includes(newCopy?.lastAffectedByCardId as CardIds) ||
					hideInfoWhenPlayerPlaysIt.includes(newCopy?.creatorCardId as CardIds)));
		// Otherwise cards revealed by Coilfang Constrictor are flagged in hand very precisely, while we shouldn't have this
		// kind of granular information
		// Also, simply hiding the information in the hand markers and showing it on the decklist isn't good enough, because when
		// the battlecry is repeated with the Macaw, the player isn't even given the view of the cards. So technically, they shouldn't
		// be able to know anything new about the opponent's cards in hand, but if we show the info in the tracker they do
		// So we just hide everything
		// We also can't simply decide to hide it in the hand tracker and show it in the "In Hand" section, because otherwise
		// we would get some info when then card leaves the hand (e.g. being traded). Working around all of this is probably
		// way too much work for just that single card
		const obfuscatedCardId =
			// Some manual patches
			// Adding the info directly to the forcedHiddenCardCreators would prevent the card to be flagged when WE play the Suspicious
			// cards
			(isPlayer && newCopy?.lastAffectedByCardId == CardIds.SuspiciousAlchemist_AMysteryEnchantment) ||
			shouldObfuscate
				? copiedCard?.cardId
				: updatedCardId;
		console.debug(
			'[copied-from-entity] obfuscatedCardId',
			obfuscatedCardId,
			isPlayer,
			newCopy?.creatorCardId,
			newCopy,
			copiedCard,
		);
		// We don't add the initial cards in the deck, so if no card is found, we create it
		const updatedCopiedCard =
			copiedCard?.update({
				cardId: obfuscatedCardId,
				cardName: this.i18n.getCardName(obfuscatedCardId, copiedCard.cardName),
				manaCost: newCopy?.manaCost ?? copiedCard.manaCost,
			} as DeckCard) ??
			DeckCard.create({
				cardId: obfuscatedCardId,
				cardName: this.i18n.getCardName(obfuscatedCardId),
				entityId: isPlayer ? copiedCardEntityId : null,
				// This was introduced so that discovering cards from deck would update the info of the card in deck
				// with the updated info from the Discover (initially for Lady Prestor)
				manaCost: isPlayer ? newCopy?.manaCost : null,
				zone: undefined,
			} as DeckCard);
		const updatedCopiedCardWithPosition = updatedCopiedCard.update({
			positionFromTop: newCopy?.creatorCardId === CardIds.Plagiarizarrr ? 0 : updatedCopiedCard.positionFromTop,
		});
		console.debug(
			'[copied-from-entity] updatedCopiedCardWithPosition',
			updatedCopiedCardWithPosition,
			updatedCopiedCard,
			copiedCard,
			newCopy,
		);
		const newCopiedDeck =
			copiedCardZone === Zone.DECK
				? this.helper.empiricReplaceCardInZone(copiedDeck.deck, updatedCopiedCardWithPosition, true, {
						cost: updatedCopiedCardWithPosition.manaCost,
				  })
				: copiedDeck.deck;
		console.debug('[copied-from-entity] newCopiedDeck', newCopiedDeck, copiedDeck);
		const newCopiedPlayer =
			copiedCardZone === Zone.DECK
				? copiedDeck.update({ deck: newCopiedDeck })
				: this.helper.updateCardInDeck(copiedDeck, updatedCopiedCardWithPosition, isCopiedPlayer);
		console.debug('[copied-from-entity] newCopiedPlayer', newCopiedPlayer);

		// Also update the secrets
		const copiedDeckWithSecrets: DeckState = this.updateSecrets(
			newCopiedPlayer,
			updatedCopiedCardWithPosition.cardId,
			copiedCardEntityId,
		);
		// console.debug('[copied-from-entity] copiedDeckWithSecrets', copiedDeckWithSecrets);

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
