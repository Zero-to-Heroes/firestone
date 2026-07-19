import { CardIds, GameTag, Zone, getBaseCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BoardSecret } from '../../../models/board-secret';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { SecretOption } from '../../../models/secret-option';
import { getProcessedCard } from '../../card-utils';
import {
	CREATES_PUBLIC_COPY_FROM_DECK,
	forcedHiddenCardCreators,
	isSelfCopyHandLeakIncompleteLogCardId,
} from '../../hs-utils';
import { revealCard } from '../card-reveal';
import { CopiedFromEntityIdGameEvent } from '../events/copied-from-entity-id-game-event';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DREDGE_IN_OPPONENT_DECK_CARD_IDS } from './card-dredged-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

const COPY_KNOW_EXACT_CARD_IN_OPPONENT_HAND = [
	CardIds.AzalinaSoulthief,
	CardIds.MindrenderIllucia,
	CardIds.SketchArtist_TOY_916,
	// Opponent just drew this exact entity; the copy in our hand is a 1:1 reveal of that hand row.
	CardIds.KeymasterAlabaster,
	CardIds.KeymasterAlabaster_CORE_SCH_717,
];

/**
 * Effects where the opponent discovers a card from their OWN deck and immediately draws/plays that very
 * card (no persistent copy is left in the deck). The discover preview is a SETASIDE token whose
 * COPIED_FROM_ENTITY_ID points back at the still-in-deck source entity. Because the copy and source share
 * the same controller, the generic obfuscation below is skipped and we would otherwise reveal the source
 * card in the opponent's deck (info leak) and create a duplicate row once it is drawn to hand. For these
 * effects we treat the COPIED_FROM event as a no-op: we learn nothing legitimate and the regular draw
 * removes a filler from the deck + flags the drawn card.
 *
 * NOTE: this must NOT include effects that shuffle real copies into the deck (e.g. Triangulate). Those
 * rely on the preview reveal to later identify the shuffled copies, so they keep the default behaviour.
 */
const OPPONENT_SELF_DISCOVER_FROM_DECK_NO_COPY_CREATORS: readonly CardIds[] = [
	CardIds.CommanderGeddon_BarrenEnchantment_CATA_591e,
	CardIds.TrackingCore,
	CardIds.TrackingLegacy,
	CardIds.TrackingVanilla,
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
		const revealedCopyCardId = newCopy?.cardId ?? cardId;
		// The issue when using only the entityId is that we can't find the card in deck, as
		// the entityId is not stored there
		let copiedCard: DeckCard | undefined = copiedDeck.findCard(copiedCardEntityId)?.card;
		console.debug(
			'[copied-from-entity] copiedCard',
			`entityId:${entityId}__`,
			isPlayer,
			copiedCard,
			copiedCardZone,
			newCopy,
			copiedDeck,
			copiedCardEntityId,
			gameEvent,
			deck,
		);
		// The two halves of a SHATTERED cards are flagged as copies of each other, while it is not the case
		if (copiedCard?.tags?.[GameTag.SHATTERED] === 1) {
			console.debug(
				'[copied-from-entity] copiedCard is shattered, ignoring',
				`entityId:${entityId}__`,
				copiedCard,
			);
			return currentState;
		}

		// Typically happens when the opponent copies a card in our deck. Their copy is known (we know entityId + cardId)
		// but it references an entityId on our side that we don't know of (if it's in the deck).
		// Use the game-event cardId when the opponent copy is not tracked in deck yet (e.g. PowerTaskList replay).
		if (!copiedCard && copiedCardZone === Zone.DECK && revealedCopyCardId?.length) {
			copiedCard = this.findUnlinkedDeckRowByCardId(copiedDeck, revealedCopyCardId);
			console.debug(
				'[copied-from-entity] copiedCard not found',
				`entityId:${entityId}__`,
				copiedCard,
				revealedCopyCardId,
				copiedDeck.deck,
			);
		}

		// Orphan deck row (entityId from CREATE_CARD_IN_DECK, no cardId yet): prefer the deckstring row.
		if (
			copiedCard &&
			!copiedCard.cardId?.length &&
			copiedCardZone === Zone.DECK &&
			isCopiedPlayer &&
			!isPlayer &&
			revealedCopyCardId?.length
		) {
			const deckstringRow = this.findUnlinkedDeckRowByCardId(copiedDeck, revealedCopyCardId);
			if (deckstringRow) {
				copiedCard = deckstringRow;
			}
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

		const updatedCardId = newCopy?.cardId ?? copiedCard?.cardId ?? cardId;
		/** Copy and source are the same player (e.g. Malevolent Mutant); local may still be the opponent in replay. */
		const copyAndSourceSameController = copiedCardControllerId === controllerId;
		const dredgerCardIdHint = newCopy?.creatorCardId ?? newCopy?.lastAffectedByCardId;
		const dredgeMechanicOnCreator =
			!!dredgerCardIdHint && (this.allCards.getCard(dredgerCardIdHint)?.mechanics?.includes('DREDGE') ?? false);
		const copyDredgeFromLog = gameEvent.additionalData.copyDredgeTag === true;
		// Incomplete-log self-copy (see `SELF_COPY_HAND_LEAK_INCOMPLETE_LOG_CARD_IDS`): omit DREDGE / late DeckCard fields.
		const selfCopyHandLeakIncompleteLogToken =
			copyAndSourceSameController &&
			(isSelfCopyHandLeakIncompleteLogCardId(newCopy?.creatorCardId) ||
				isSelfCopyHandLeakIncompleteLogCardId(newCopy?.lastAffectedByCardId) ||
				isSelfCopyHandLeakIncompleteLogCardId(copiedCard?.lastAffectedByCardId));
		const dredgeSignalForSelfCopy =
			newCopy?.tags?.[GameTag.DREDGE] === 1 ||
			copyDredgeFromLog ||
			dredgeMechanicOnCreator ||
			selfCopyHandLeakIncompleteLogToken;
		/** Opponent dredged their own deck: copy+source same controller; do not reveal dredge choice to local player. */
		const isOpponentSelfDredge =
			!isPlayer &&
			copyAndSourceSameController &&
			(copiedCardZone === Zone.DECK || copiedCardZone === Zone.HAND) &&
			dredgeSignalForSelfCopy;
		/** Opponent effect reveals a linked/setaside token in logs; the source hand row stays hidden in-game (e.g. Fast Forward + Naralex Herald). */
		const hideOpponentSameControllerHandLinkedReveal =
			!isPlayer &&
			copyAndSourceSameController &&
			copiedCardZone === Zone.HAND &&
			!copiedCard?.cardId?.length &&
			!!newCopy &&
			(forcedHiddenCardCreators.includes(newCopy.creatorCardId as CardIds) ||
				forcedHiddenCardCreators.includes(newCopy.lastAffectedByCardId as CardIds));
		// Commander Geddon (Barren) and similar: opponent discovers from their own deck and draws the picked
		// card. The discover preview's COPIED_FROM points at the still-in-deck source; revealing it here both
		// leaks the card and leaves a duplicate row once it is drawn. We learn nothing legitimate, so ignore
		// the event entirely and let the subsequent CARD_DRAW_FROM_DECK handle removing a filler + flagging
		// the drawn card. Gated to a curated creator list so effects that shuffle real copies into the deck
		// (e.g. Triangulate) keep their default reveal behaviour.
		const newCopyCreator = (newCopy?.creatorCardId ?? newCopy?.lastAffectedByCardId) as CardIds;
		const isOpponentSelfDiscoverFromDeckNoCopy =
			!isPlayer &&
			copyAndSourceSameController &&
			copiedCardZone === Zone.DECK &&
			!isOpponentSelfDredge &&
			!copiedCard?.cardId &&
			OPPONENT_SELF_DISCOVER_FROM_DECK_NO_COPY_CREATORS.includes(newCopyCreator);
		if (isOpponentSelfDiscoverFromDeckNoCopy) {
			console.debug(
				'[copied-from-entity] opponent self-discover from own deck (no copy), ignoring to avoid leak',
				entityId,
				copiedCardEntityId,
				newCopyCreator,
			);
			return currentState;
		}

		// Cross-player copy of a card still in the other player's deck (e.g. Ashamane copying a ritual):
		// must not write the source entity id / imbue token into the local player's deck rows.
		if (copiedCardZone === Zone.DECK && isPlayer && isCopiedPlayer && !copyAndSourceSameController) {
			console.debug(
				'[copied-from-entity] cross-player deck copy would corrupt local deck, ignoring',
				`entityId:${entityId}__`,
				copiedCardEntityId,
				cardId,
			);
			return currentState;
		}

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
		console.debug(
			'[copied-from-entity] shouldObfuscate',
			`entityId:${entityId}__`,
			shouldObfuscate,
			isPlayer,
			isCopiedPlayer,
			copiedCard,
		);
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
			isOpponentSelfDredge ||
			hideOpponentSameControllerHandLinkedReveal
				? copiedCard?.cardId
				: updatedCardId;
		console.debug(
			'[copied-from-entity] obfuscatedCardId',
			`entityId:${entityId}__`,
			obfuscatedCardId,
			shouldObfuscate,
			isPlayer,
			newCopy?.creatorCardId,
			newCopy,
			copiedCard,
		);
		const deckTrackingCardId =
			copiedCardZone === Zone.DECK && obfuscatedCardId
				? getBaseCardId(obfuscatedCardId, this.allCards.getService())
				: obfuscatedCardId;
		// We don't add the initial cards in the deck, so if no card is found, we create it
		const updatedCopiedCard = (copiedCard ?? DeckCard.create({}))
			.update({
				cardId: deckTrackingCardId,
				cardName: deckTrackingCardId?.length
					? this.allCards.getCard(deckTrackingCardId).name
					: (copiedCard?.cardName ?? null),
				refManaCost:
					(isCopiedPlayer ? newCopy?.refManaCost : null) ??
					(deckTrackingCardId?.length
						? getProcessedCard(deckTrackingCardId, copiedCardEntityId, copiedDeck, this.allCards)?.cost
						: copiedCard?.refManaCost),
				// DECK: keep entityId when not obfuscating (discover / deck updates; avoid leaking opponent deck ids).
				// Non-deck + local source (`isCopiedPlayer`): `updateCardInDeck` must get the source entity id so
				// `updateCardInZone` can match the hand/board row; otherwise entityId stays null and the update no-ops
				// (e.g. Sigil of Cinder copy in hand — wrong deck-tracker hand count).
				entityId: isOpponentSelfDredge
					? copiedCardEntityId
					: copiedCardZone === Zone.DECK && !shouldObfuscate
						? copiedCardEntityId
						: copiedCardZone !== Zone.DECK &&
							  copiedCardEntityId != null &&
							  (isCopiedPlayer || copyAndSourceSameController)
							? copiedCardEntityId
							: null,
				positionFromTop: isOpponentSelfDredge ? 0 : shouldObfuscate ? null : copiedCard?.positionFromTop,
				positionFromBottom: isOpponentSelfDredge
					? null
					: shouldObfuscate
						? null
						: copiedCard?.positionFromBottom,
			} as DeckCard)
			.update(
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
			`entityId:${entityId}__`,
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
		console.debug(
			'[copied-from-entity] isCardMovedAroundInPlayerDeck',
			`entityId:${entityId}__`,
			isCardMovedAroundInPlayerDeck,
		);

		const newCopiedDeck =
			// Sometimes the card already exists in the deck (eg if it has a start of combat effect)
			copiedCardZone === Zone.DECK && !isCardMovedAroundInPlayerDeck
				? this.linkCopiedCardIntoDeck(copiedDeck.deck, updatedCopiedCardWithPosition)
				: copiedDeck.deck;
		console.debug('[copied-from-entity] newCopiedDeck', `entityId:${entityId}__`, newCopiedDeck, copiedDeck);
		const newCopiedPlayerBeforeReveal =
			copiedCardZone === Zone.DECK
				? copiedDeck.update({ deck: newCopiedDeck })
				: this.helper.updateCardInDeck(copiedDeck, updatedCopiedCardWithPosition, isCopiedPlayer);
		console.debug('[copied-from-entity] newCopiedPlayer', `entityId:${entityId}__`, newCopiedPlayerBeforeReveal);

		// We learned something about the copied deck, so maybe we have information we can show, like Fabled package cards
		const newCopiedPlayer = revealCard(newCopiedPlayerBeforeReveal, updatedCopiedCardWithPosition, this.allCards);

		// Also update the secrets
		const copiedDeckWithSecrets: DeckState = this.updateSecrets(
			newCopiedPlayer,
			updatedCopiedCardWithPosition.cardId,
			copiedCardEntityId,
		);
		console.debug('[copied-from-entity] copiedDeckWithSecrets', `entityId:${entityId}__`, copiedDeckWithSecrets);

		let copiedDeckWithKnownCardsInHand = copiedDeckWithSecrets;
		if (copiedCardZone === Zone.HAND && !isCopiedPlayer) {
			const resolvedRevealCardId = cardId || newCopy?.cardId;
			// Only a curated whitelist (Azalina / Illucia / Sketch Artist) may stamp cardId onto a
			// specific opponent hand entity. Discover-from-hand effects (e.g. Deja Vu) only learn that
			// the card is somewhere in hand — use additionalKnownCardsInHand.
			if (!!newCopy && shouldFlagExactCardInOpponentHand(newCopy) && !!resolvedRevealCardId?.length) {
				console.debug(
					'[copied-from-entity] know exact card in opponent hand',
					`entityId:${entityId}__`,
					newCopy.creatorCardId,
					copiedDeckWithSecrets.hand,
					newCopy,
					copiedCard,
				);
				const refCard = this.allCards.getCard(resolvedRevealCardId);
				const sourceEntityId = copiedCard?.entityId ?? copiedCardEntityId;
				const newHand = copiedDeckWithSecrets.hand.map((card) =>
					card.entityId === sourceEntityId
						? card.update({
								cardId: resolvedRevealCardId,
								cardName: refCard.name,
								refManaCost: refCard.cost,
							})
						: card,
				);
				console.debug('[copied-from-entity] newHand', `entityId:${entityId}__`, newHand);
				copiedDeckWithKnownCardsInHand = copiedDeckWithSecrets.update({
					hand: newHand,
				});
			} else if (resolvedRevealCardId?.length) {
				const cardIdToAdd = resolvedRevealCardId;
				copiedDeckWithKnownCardsInHand = copiedDeckWithSecrets.update({
					additionalKnownCardsInHand: [
						...copiedDeckWithSecrets.additionalKnownCardsInHand.filter((c) => c !== cardIdToAdd),
						cardIdToAdd,
					],
				});
				console.debug(
					'[copied-from-entity] copiedDeckWithKnownCardsInHand',
					`entityId:${entityId}__`,
					copiedDeckWithKnownCardsInHand,
					cardIdToAdd,
				);
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
			console.debug('[copied-from-entity] newOppHand', `entityId:${entityId}__`, newOppHand);
			result = Object.assign(new GameState(), result, {
				opponentDeck: opp.update({ hand: newOppHand }),
			});
		}

		// Same-side hand copy + source (e.g. Malevolent Mutant): bidirectional cardCopyLinks so
		// processCardLinks can mirror cardId when either the copy or the original is played first.
		// Skip incomplete-log self-copy tokens: linking mirrors the revealed token onto the hidden hand row.
		if (
			copiedCardZone === Zone.HAND &&
			isPlayer === isCopiedPlayer &&
			copiedCardEntityId != null &&
			entityId != null &&
			copiedCardEntityId !== entityId &&
			!selfCopyHandLeakIncompleteLogToken
		) {
			const deckKey = isPlayer ? 'playerDeck' : 'opponentDeck';
			const deckState = result[deckKey];
			const linked = this.linkBidirectionalCopyPair(deckState, entityId, copiedCardEntityId);
			console.debug('[copied-from-entity] linked', `entityId:${entityId}__`, linked);
			result = Object.assign(new GameState(), result, {
				[deckKey]: linked,
			});
		}

		return result;
	}

	/** Deckstring row for cardId without entityId (initial deck padding). */
	private findUnlinkedDeckRowByCardId(deck: DeckState, cardId: string): DeckCard | undefined {
		const baseCardId = getBaseCardId(cardId, this.allCards.getService());
		return (
			deck.deck.find(
				(card) =>
					getBaseCardId(card.cardId, this.allCards.getService()) === baseCardId &&
					card.positionFromBottom == null &&
					card.positionFromTop == null &&
					!card.entityId &&
					!card.creatorCardId,
			) ??
			deck.deck.find(
				(card) =>
					getBaseCardId(card.cardId, this.allCards.getService()) === baseCardId &&
					!card.entityId &&
					!card.creatorCardId,
			)
		);
	}

	/**
	 * Link a discovered/copied card (cardId + entityId) back into the deck zone.
	 *
	 * `empiricReplaceCardInZone` removes a single matching row then re-adds the linked row, so the deck
	 * count is already preserved. We must only additionally collapse a leftover unlinked deckstring
	 * duplicate when the row we consumed was an entityId-only ghost: revealing that ghost's identity can
	 * expose it as a real deckstring copy we already track (e.g. Chainbreaker Hogger), leaving a spurious
	 * extra row. When we instead replaced a real deckstring copy - which is what happens for a
	 * self-discover-from-deck preview like Tracking, where the deck legitimately holds several copies of
	 * the previewed card - collapsing another copy would wrongly drop a card from the deck.
	 */
	private linkCopiedCardIntoDeck(deck: readonly DeckCard[], linked: DeckCard): readonly DeckCard[] {
		const [afterRemoval, removedCard] = this.helper.removeSingleCardFromZone(
			deck,
			linked.cardId,
			linked.entityId,
			true,
			false,
			{ cost: linked.refManaCost }, // Not totally sure about ref vs actual
		);
		console.debug(
			'[copied-from-entity] linkCopiedCardIntoDeck afterRemoval',
			`entityId:${linked.entityId}__`,
			afterRemoval,
			removedCard,
			linked,
		);
		const withLinked = this.helper.addSingleCardToZone(afterRemoval, linked);
		const consumedGhostRow = !!removedCard && !removedCard.cardId?.length;
		console.debug(
			'[copied-from-entity] linkCopiedCardIntoDeck withLinked',
			`entityId:${linked.entityId}__`,
			withLinked,
			consumedGhostRow,
		);
		return this.dedupePlayerDeckAfterCopiedFromLink(withLinked, linked, consumedGhostRow);
	}

	/**
	 * After linking entityId + cardId, drop orphan rows (entityId-only ghosts) and duplicate linked rows.
	 * When `collapseUnlinkedDuplicate` is set (a ghost row was consumed while linking), also drop one
	 * unlinked deckstring duplicate of the same card (empiricReplace may remove the ghost but leave the
	 * old padding row). See {@link linkCopiedCardIntoDeck} for why this must stay conditional.
	 */
	private dedupePlayerDeckAfterCopiedFromLink(
		deck: readonly DeckCard[],
		linked: DeckCard,
		collapseUnlinkedDuplicate: boolean,
	): readonly DeckCard[] {
		if (!linked.cardId?.length || linked.entityId == null) {
			return deck;
		}
		const baseCardId = getBaseCardId(linked.cardId, this.allCards.getService());
		let removedUnlinkedDuplicate = false;
		let keptLinkedRow = false;
		return deck.filter((card) => {
			const cardEntityId = card.entityId ?? card.trueEntityId;
			const isLinkedRow =
				cardEntityId === linked.entityId &&
				getBaseCardId(card.cardId, this.allCards.getService()) === baseCardId;
			if (isLinkedRow) {
				if (keptLinkedRow) {
					return false;
				}
				keptLinkedRow = true;
				return true;
			}
			if (cardEntityId === linked.entityId && !card.cardId?.length) {
				return false;
			}
			if (
				collapseUnlinkedDuplicate &&
				!removedUnlinkedDuplicate &&
				getBaseCardId(card.cardId, this.allCards.getService()) === baseCardId &&
				!card.entityId &&
				!card.creatorCardId
			) {
				removedUnlinkedDuplicate = true;
				return false;
			}
			return true;
		});
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
