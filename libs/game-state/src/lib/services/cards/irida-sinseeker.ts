/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Irida Sinseeker (JAIL_719)
 * Lifesteal. Battlecry: Send your deck to the Void. At the start of your turns, get two cards from the Void.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { DeckCard } from '../../models/deck-card';
import { PowerEndCard, PowerEndInput } from './_card.type';

export const IridaSinseeker: PowerEndCard & {
	cardReceivedFromTheVoid: (card: DeckCard, existingVoidZone: readonly DeckCard[]) => readonly DeckCard[];
} = {
	cardIds: [CardIds.IridaSinseeker_JAIL_719],
	powerEnd: (input: PowerEndInput) => {
		const { currentState, gameEvent, allCards } = input;
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		// Find all cards sent to the Void
		const cardsInVoid = deck.otherZone.filter(isInTheVoidPredicate);
		const newDeck = deck.update({
			voidZone: cardsInVoid,
		});
		console.debug(
			'[debug] IridaSinseeker.powerEnd',
			cardId,
			isPlayer,
			cardsInVoid,
			newDeck,
			currentState,
			gameEvent,
		);

		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	},
	cardReceivedFromTheVoid: (card: DeckCard, existingVoidZone: readonly DeckCard[]): readonly DeckCard[] => {
		let existingCardInZone = !!card.entityId ? existingVoidZone.find((c) => c.entityId === card.entityId) : null;
		if (!existingCardInZone) {
			existingCardInZone = !!card.cardId
				? existingVoidZone.find((c) => c.cardId === card.cardId && !c.entityId)
				: null;
		}
		if (!existingCardInZone) {
			existingCardInZone =
				existingVoidZone.find((c) => !c.cardId && !c.entityId) ?? existingVoidZone.find((c) => !c.cardId);
		}
		if (!existingCardInZone) {
			console.warn(
				'Could not find card in void zone',
				card.cardId,
				card.entityId,
				existingVoidZone.map((c) => `${c.cardId}__${c.entityId}`),
			);
		}
		const newVoidZone = existingCardInZone
			? existingVoidZone.filter((c) => c !== existingCardInZone)
			: existingVoidZone;
		console.debug(
			'[debug] IridaSinseeker.cardReceivedFromTheVoid',
			card.cardId,
			card.entityId,
			existingCardInZone,
			newVoidZone,
		);
		return newVoidZone;
	},
};

export const isInTheVoidPredicate = (c: DeckCard) =>
	c.zone === 'SETASIDE' && c.lastAffectedByCardId === CardIds.IridaSinseeker_JAIL_719;
