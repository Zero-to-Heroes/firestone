import { CardIds, Zone } from '@firestone-hs/reference-data';
import { BoardSecret, DeckCard, DeckState, GameState, SecretOption } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { CopiedFromEntityIdGameEvent } from '../../../models/mainwindow/game-events/copied-from-entity-id-game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DREDGE_IN_OPPONENT_DECK_CARD_IDS } from './card-dredged-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CopiedFromEntityIdParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
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
		// The issue when using only the entityId is that we can't find the card in deck, as
		// the entityId is not stored there
		let copiedCard: DeckCard = copiedDeck.findCard(copiedCardEntityId)?.card;
		console.debug(
			'[copied-from-entity] copiedCard',
			isPlayer,
			copiedCard,
			newCopy,
			copiedDeck,
			copiedCardEntityId,
			gameEvent,
			deck,
		);

		// Typically happens when the opponent copies a card in our deck. Their copy is known (we know entityId + cardId)
		// but it references an entityId on our side that we don't know of (if it's in the deck)
		if (!copiedCard && copiedCardZone === Zone.DECK && !!newCopy?.cardId) {
			const copyCardId = newCopy.cardId;
			copiedCard =
				copiedDeck.deck.find(
					(card) =>
						card.cardId === copyCardId && card.positionFromBottom == null && card.positionFromTop == null,
				) ?? copiedDeck.deck.find((card) => card.cardId === copyCardId);
			console.debug('[copied-from-entity] copiedCard not found', copiedCard, copyCardId, copiedDeck.deck);
		}

		// Cards like Masked Reveler summon a copy of a card from the deck. Because we don't store the entityId of
		// unknown cards in deck (to avoid info leaks), we can't find the right card from the event info, and so
		// we can't decide to update the card in the deck.
		// However, we can still use that zone information to create an empty card in the zone, so that we know that
		// the card might be inside their deck (though we don't want to store the entityId, because that would leak to
		// info leaks)

		const updatedCardId = newCopy?.cardId ?? copiedCard?.cardId;
		// There seems to be info leaks in the logs when the opponent discovers a card in their deck
		// e.g. when they play Fracking or From the Depths (Dredge effects)
		// When the player copies (via Disguised K'Thir for instance) we don't obfuscate the card, because we know it
		const shouldObfuscate = !isCopiedPlayer && !isPlayer;
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
			shouldObfuscate ||
			(isPlayer && newCopy?.lastAffectedByCardId == CardIds.SuspiciousAlchemist_AMysteryEnchantment)
				? copiedCard?.cardId
				: updatedCardId;
		console.debug(
			'[copied-from-entity] obfuscatedCardId',
			obfuscatedCardId,
			shouldObfuscate,
			isPlayer,
			newCopy?.creatorCardId,
			newCopy,
			copiedCard,
		);
		// We don't add the initial cards in the deck, so if no card is found, we create it
		const updatedCopiedCard = (copiedCard ?? DeckCard.create({})).update({
			cardId: obfuscatedCardId,
			cardName: this.i18n.getCardName(obfuscatedCardId),
			manaCost: (isCopiedPlayer ? newCopy?.manaCost : null) ?? this.allCards.getCard(obfuscatedCardId)?.cost,
			// Always set the entityId to null when it's the opponent's deck to avoid info leaks
			// UPDATE: we don't do it here, do that when the card is drawn, so that we still have the entityId
			// to differentiate the cards (e.g. when discovering copies of the same card)
			// This was introduced so that discovering cards from deck would update the info of the card in deck
			// with the updated info from the Discover (initially for Lady Prestor)
			// UPDATE 2024-10-29: not sure what this means...
			entityId: copiedCardZone === Zone.DECK && !shouldObfuscate ? copiedCardEntityId : null,
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

		// We don't want to create a new card when the card is simply moved around in the deck.
		// This is the case when the opponent dredges in our deck - we don't know what they chose, so we can't use
		// this information to simply update the card position. We don't want to create a new card though, as
		// there is no new card.
		const isCardMovedAroundInPlayerDeck =
			isCopiedPlayer &&
			!isPlayer &&
			DREDGE_IN_OPPONENT_DECK_CARD_IDS.includes(newCopy?.lastAffectedByCardId as CardIds);
		console.debug('[copied-from-entity] isCardMovedAroundInPlayerDeck', isCardMovedAroundInPlayerDeck);

		const newCopiedDeck =
			copiedCardZone === Zone.DECK && !isCardMovedAroundInPlayerDeck
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
		console.debug('[copied-from-entity] copiedDeckWithSecrets', copiedDeckWithSecrets);

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
