import { AllCardsService, CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../models/game-state';
import { GameEvent } from '../game-events/game-event';
import { ActionChainParser, ChainParsingCard } from './_card.type';

/** Infer the unchosen Choose One option from the chosen one (e.g. ETC_373a <-> ETC_373b). */
function inferUnchosenChooseOneOption(
	chosenCardId: string,
	allCards: AllCardsService,
): string | null {
	if (!chosenCardId) return null;
	const swapSuffix = (suffix: string): string => {
		switch (suffix) {
			case 'a':
				return 'b';
			case 'b':
				return 'a';
			case 'c':
				return 'a';
			default:
				return '';
		}
	};
	const lastChar = chosenCardId.slice(-1);
	if (/^[abc]$/.test(lastChar)) {
		const base = chosenCardId.slice(0, -1);
		const otherSuffix = swapSuffix(lastChar);
		const unchosen = base + otherSuffix;
		if (allCards.getCard(unchosen)?.id) {
			return unchosen;
		}
	}
	const refCard = allCards.getCard(chosenCardId);
	const relatedIds = refCard?.relatedCardDbfIds?.map((dbfId) => allCards.getCardFromDbfId(dbfId)?.id) ?? [];
	const otherOption = relatedIds.find((id) => id && id !== chosenCardId);
	return otherOption ?? null;
}

export const JerryRigCarpenter: ChainParsingCard = {
	cardIds: [CardIds.JerryRigCarpenter],
	chainParser: (allCards: AllCardsService) => new JerryRigCarpenterParser(allCards),
};

export class JerryRigCarpenterParser implements ActionChainParser {
	constructor(private readonly allCards: AllCardsService) {}

	public appliesOnEvent(): GameEvent['type'] {
		return GameEvent.CARD_PLAYED;
	}

	public async parse(currentState: GameState, events: readonly GameEvent[]): Promise<GameState> {
		const reversedEvents = [...events].reverse();
		const lastEvent = reversedEvents.shift();
		if (lastEvent?.type !== GameEvent.CARD_PLAYED) {
			return currentState;
		}

		// Only when opponent plays a card
		const isPlayer = lastEvent.controllerId === lastEvent.localPlayer.PlayerId;
		if (isPlayer) {
			return currentState;
		}

		// Creator must be Jerry Rig Carpenter
		const creatorCardId = lastEvent.additionalData?.creatorCardId;
		if (creatorCardId !== CardIds.JerryRigCarpenter) {
			return currentState;
		}

		const playedEntityId = lastEvent.entityId;
		const playedCardId = lastEvent.cardId;

		// Find RECEIVE_CARD_IN_HAND for the played entity to get creatorEntityId
		const receiveEvent = reversedEvents.find(
			(e) =>
				e.type === GameEvent.RECEIVE_CARD_IN_HAND &&
				e.entityId === playedEntityId &&
				e.additionalData?.creatorCardId === CardIds.JerryRigCarpenter,
		);
		const creatorEntityId = receiveEvent?.additionalData?.creatorEntityId;
		if (creatorEntityId == null) {
			return currentState;
		}

		// Find the other card in opponent's hand with same creator, no cardId
		const unchosenCard = currentState.opponentDeck.hand.find(
			(c) =>
				c.creatorEntityId === creatorEntityId &&
				c.creatorCardId === CardIds.JerryRigCarpenter &&
				(!c.cardId || c.cardId === ''),
		);
		if (!unchosenCard) {
			return currentState;
		}

		const inferredCardId = inferUnchosenChooseOneOption(playedCardId, this.allCards);
		if (!inferredCardId) {
			return currentState;
		}

		const refCard = this.allCards.getCard(inferredCardId);
		const newHand = currentState.opponentDeck.hand.map((c) =>
			c.entityId === unchosenCard.entityId
				? c.update({
						cardId: inferredCardId,
						cardName: refCard?.name,
						refManaCost: refCard?.cost ?? 0,
						cardType: refCard?.type,
					})
				: c,
		);

		const newDeck = currentState.opponentDeck.update({
			hand: newHand,
		});
		return currentState.update({
			opponentDeck: newDeck,
		});
	}
}
