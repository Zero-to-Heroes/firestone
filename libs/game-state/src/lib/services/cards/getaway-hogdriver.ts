/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Getaway Hogdriver (JAIL_462)
 * Battlecry: Draw 2 cards. If they're both minions, gain Charge.
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';

import { and, inDeck, minion, side } from '../card-highlight/selectors';
import { CustomEffectCard, GeneratingCard, SelectorCard } from './_card.type';

export const GetawayHogdriver: SelectorCard & GeneratingCard & CustomEffectCard = {
	cardIds: [CardIds.GetawayHogdriver_JAIL_462],
	effects: ['CFMFX_HogChopper_FX'],
	publicTutor: true,
	selector: (inputSide) => and(side(inputSide), inDeck, minion),
	customEffect: ({ currentState, gameEvent, allCards }) => {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const cardId = gameEvent.additionalData?.sourceCardId;
		if (!GetawayHogdriver.cardIds.includes(cardId as CardIds)) {
			return currentState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		// console.debug('GetawayHogdriver.customEffect', isPlayer, deck.hand, gameEvent, currentState);
		const newHand = deck.hand.map((c) => {
			if (c.lastAffectedByEntityId === gameEvent.additionalData.sourceEntityId) {
				return c.update({
					guessedInfo: {
						...c.guessedInfo,
						cardType: CardType.MINION,
					},
				});
			}
			return c;
		});

		const newDeck = deck.update({
			hand: newHand,
		});
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	},
};
