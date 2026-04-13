import { CardIds, GameTag, Zone } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BoardSecret } from '../../../models/board-secret';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { SecretOption } from '../../../models/secret-option';
import { getProcessedCard } from '../../card-utils';
import { CREATES_PUBLIC_COPY_FROM_DECK } from '../../hs-utils';
import { CopiedFromEntityIdGameEvent } from '../events/copied-from-entity-id-game-event';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DREDGE_IN_OPPONENT_DECK_CARD_IDS } from './card-dredged-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

const COPY_KNOW_EXACT_CARD_IN_OPPONENT_HAND = [
	CardIds.AzalinaSoulthief,
	CardIds.MindrenderIllucia,
	CardIds.SketchArtist_TOY_916,
];

export class CopiedFromEntityIdParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: CopiedFromEntityIdGameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		let copiedCardEntityId: number | undefined | null = gameEvent.additionalData.copiedCardEntityId;
		const copiedCardControllerId = gameEvent.additionalData.copiedCardControllerId;
		const copiedCardZone = gameEvent.additionalData.copiedCardZone;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const isCopiedPlayer = copiedCardControllerId === localPlayer.PlayerId;
		const copiedDeck = isCopiedPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const newCopy: DeckCard | undefined = deck.findCard(entityId)?.card;
		// The issue when using only the entityId is that we can't find the card in deck, as
		// the entityId is not stored there
		let copiedCard: DeckCard | undefined = copiedDeck.findCard(copiedCardEntityId)?.card;
		console.debug(
			'[copied-from-entity] copiedCard',
			isPlayer,
			copiedCard,
			copiedCardZone,
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

		// Avoid info leaks
		// 2025-11-13: If we already know the cardId and entityId, we don't need to hide it (eg we discover a card that has a Start of Combat effect)
		// 2025-11-13: is this really true?
		if (
			!copiedCard?.entityId &&
			!copiedCard?.cardId &&
			(copiedCard?.positionFromTop != null || copiedCard?.positionFromBottom != null)
		) {
			copiedCard = undefined;
			copiedCardEntityId = undefined;
		}

		// Cards like Masked Reveler summon a copy of a card from the deck. Because we don't store the entityId of
		// unknown cards in deck (to avoid info leaks), we can't find the right card from the event info, and so
		// we can't decide to update the card in the deck.
		// However, we can still use that zone information to create an empty card in the zone, so that we know that
		// the card might be inside their deck (though we don't want to store the entityId, because that would leak to
		// info leaks)

		const updatedCardId = newCopy?.cardId ?? copiedCard?.cardId;
		/** Copy and source are the same player (e.g. Malevolent Mutant); local may still be the opponent in replay. */
		const copyAndSourceSameController = copiedCardControllerId === controllerId;
		const dredgerCardIdHint = newCopy?.creatorCardId ?? newCopy?.lastAffectedByCardId;
		const dredgeMechanicOnCreator =
			!!dredgerCardIdHint &&
			(this.allCards.getCard(dredgerCardIdHint)?.mechanics?.includes('DREDGE') ?? false);
		const copyDredgeFromLog = gameEvent.additionalData.copyDredgeTag === true;
		const dredgeSignalForSelfCopy =
			newCopy?.tags?.[GameTag.DREDGE] === 1 || copyDredgeFromLog || dredgeMechanicOnCreator;
		/** Opponent dredged their own deck: copy+source same controller; do not reveal dredge choice to local player. */
		const isOpponentSelfDredge =
			!isPlayer &&
			copyAndSourceSameController &&
			(copiedCardZone === Zone.DECK || copiedCardZone === Zone.HAND) &&
			dredgeSignalForSelfCopy;
		const shouldObfuscate =
			// Copy + source same controller (e.g. Malevolent Mutant): not "opponent discovered our card" — allow cardId sync.
			!copyAndSourceSameController &&
			// There seems to be info leaks in the logs when the opponent discovers a card in their deck
			// e.g. when they play Fracking or From the Depths (Dredge effects)
			!isCopiedPlayer &&
			// When the player copies (via Disguised K'Thir for instance) we don't obfuscate the card, because we know it
			!isPlayer &&
			// 2025-01-09: this doesn't work. If the opponent discovers a copy of a card in their deck, and the card is already known,
			// this wlil create an additional copy. So we add a check that it doesn't have a known cardId at least
			!copiedCard?.cardId &&
			// Cards that summon copies of card in the deck into play
			!CREATES_PUBLIC_COPY_FROM_DECK.includes(newCopy?.creatorCardId as CardIds);
		console.debug('[copied-from-entity] shouldObfuscate', shouldObfuscate, isPlayer, isCopiedPlayer, copiedCard);
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
			// Works for all "Suspicious" cards
			(isPlayer && newCopy?.lastAffectedByCardId == CardIds.SuspiciousAlchemist_AMysteryEnchantment) ||
			isOpponentSelfDredge
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
			cardName: obfuscatedCardId?.length
				? this.allCards.getCard(obfuscatedCardId).name
				: copiedCard?.cardName ?? null,
			refManaCost:
				(isCopiedPlayer ? newCopy?.refManaCost : null) ??
				(obfuscatedCardId?.length
					? getProcessedCard(obfuscatedCardId, copiedCardEntityId, copiedDeck, this.allCards)?.cost
					: copiedCard?.refManaCost),
			// DECK: keep entityId when not obfuscating (discover / deck updates; avoid leaking opponent deck ids).
			// Non-deck + local source (`isCopiedPlayer`): `updateCardInDeck` must get the source entity id so
			// `updateCardInZone` can match the hand/board row; otherwise entityId stays null and the update no-ops
			// (e.g. Sigil of Cinder copy in hand — wrong deck-tracker hand count).
			entityId:
				isOpponentSelfDredge
					? copiedCardEntityId
					: copiedCardZone === Zone.DECK && !shouldObfuscate
						? copiedCardEntityId
						: copiedCardZone !== Zone.DECK &&
							  copiedCardEntityId != null &&
							  (isCopiedPlayer || copyAndSourceSameController)
							? copiedCardEntityId
							: null,
			positionFromTop: isOpponentSelfDredge
				? 0
				: shouldObfuscate
					? null
					: copiedCard?.positionFromTop,
			positionFromBottom: isOpponentSelfDredge ? null : shouldObfuscate ? null : copiedCard?.positionFromBottom,
		} as DeckCard).update(
			isOpponentSelfDredge
				? {
						dredged: true,
						lastAffectedByCardId: newCopy?.creatorCardId ?? newCopy?.lastAffectedByCardId,
					}
				: {},
		);
		const updatedCopiedCardWithPosition = updatedCopiedCard.update({
			positionFromTop:
				newCopy?.creatorCardId === CardIds.Plagiarizarrr && !isOpponentSelfDredge
					? 0
					: updatedCopiedCard.positionFromTop,
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
			// Sometimes the card already exists in the deck (eg if it has a start of combat effect)
			copiedCardZone === Zone.DECK && !isCardMovedAroundInPlayerDeck
				? this.helper.empiricReplaceCardInZone(copiedDeck.deck, updatedCopiedCardWithPosition, true, {
						cost: updatedCopiedCardWithPosition.refManaCost, // Not totally sure about ref vs actual
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

		let copiedDeckWithKnownCardsInHand = copiedDeckWithSecrets;
		if (copiedCardZone === Zone.HAND && !isCopiedPlayer) {
			// In this case we know exactly what card is what
			if (!!newCopy && shouldFlagExactCardInOpponentHand(newCopy)) {
				console.debug(
					'[copied-from-entity] know exact card in opponent hand',
					newCopy.creatorCardId,
					copiedDeckWithSecrets.hand,
					newCopy,
					copiedCard,
				);
				const newHand = copiedDeckWithSecrets.hand.map((card) =>
					card.entityId === copiedCard?.entityId
						? card.update({
								cardId: cardId || newCopy.cardId,
								cardName: this.allCards.getCard(cardId).name,
								refManaCost: this.allCards.getCard(cardId).cost,
							})
						: card,
				);
				console.debug('[copied-from-entity] newHand', newHand);
				copiedDeckWithKnownCardsInHand = copiedDeckWithSecrets.update({
					hand: newHand,
				});
			} else {
				// Be cautious in case of leaks
				// Maybe we'll need to add a whitelist. FromDeOtherSide should be there
				const cardIdToAdd = cardId;
				copiedDeckWithKnownCardsInHand = copiedDeckWithSecrets.update({
					additionalKnownCardsInHand: [
						...copiedDeckWithSecrets.additionalKnownCardsInHand.filter((c) => c !== cardIdToAdd),
						cardIdToAdd,
					],
				});
			}
		}

		let result = Object.assign(new GameState(), currentState, {
			[isCopiedPlayer ? 'playerDeck' : 'opponentDeck']: copiedDeckWithKnownCardsInHand,
		});

		// Opponent played Azalina (etc.): copies are in the opponent's hand but the source entities are ours.
		const revealOppHandCopyFromPlayerHand =
			copiedCardZone === Zone.HAND &&
			isCopiedPlayer &&
			!isPlayer &&
			!!copiedCard?.cardId &&
			!!newCopy &&
			(shouldFlagExactCardInOpponentHand(newCopy) || !!gameEvent.additionalData.syntheticAzalinaHandCopy);
		if (revealOppHandCopyFromPlayerHand && !!copiedCard) {
			const sourceCardId = copiedCard.cardId;
			const refCard = this.allCards.getCard(sourceCardId);
			const opp = result.opponentDeck;
			const newOppHand = opp.hand.map((card) =>
				card.entityId === newCopy.entityId
					? card.update({
							cardId: sourceCardId,
							cardName: refCard.name,
							refManaCost: refCard.cost,
						})
					: card,
			);
			result = Object.assign(new GameState(), result, {
				opponentDeck: opp.update({ hand: newOppHand }),
			});
		}

		// Same-side hand copy + source (e.g. Malevolent Mutant): bidirectional cardCopyLinks so
		// processCardLinks can mirror cardId when either the copy or the original is played first.
		if (
			copiedCardZone === Zone.HAND &&
			isPlayer === isCopiedPlayer &&
			copiedCardEntityId != null &&
			entityId != null &&
			copiedCardEntityId !== entityId
		) {
			const deckKey = isPlayer ? 'playerDeck' : 'opponentDeck';
			const deckState = result[deckKey];
			const linked = this.linkBidirectionalCopyPair(deckState, entityId, copiedCardEntityId);
			result = Object.assign(new GameState(), result, {
				[deckKey]: linked,
			});
		}

		return result;
	}

	/** Merge entity id into cardCopyLinks for both ends of a copy pair (hand/deck/board/other). */
	private linkBidirectionalCopyPair(deck: DeckState, entityA: number, entityB: number): DeckState {
		const addLink = (links: readonly number[] | undefined, id: number): readonly number[] => {
			const next = [...(links ?? []), id];
			return [...new Set(next)];
		};
		const patchZone = (cards: readonly DeckCard[]) =>
			cards.map((c) => {
				if (c.entityId === entityA) {
					return c.update({ cardCopyLinks: addLink(c.cardCopyLinks, entityB) });
				}
				if (c.entityId === entityB) {
					return c.update({ cardCopyLinks: addLink(c.cardCopyLinks, entityA) });
				}
				return c;
			});
		return deck.update({
			hand: patchZone(deck.hand),
			deck: patchZone(deck.deck),
			board: patchZone(deck.board),
			otherZone: patchZone(deck.otherZone),
		});
	}

	private updateSecrets(deck: DeckState, cardId: string, copiedCardEntityId: number | undefined | null): DeckState {
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

const shouldFlagExactCardInOpponentHand = (card: DeckCard): boolean => {
	return COPY_KNOW_EXACT_CARD_IN_OPPONENT_HAND.includes(card.creatorCardId as CardIds);
};
