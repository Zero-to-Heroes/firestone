import { Card } from '@firestone/memory';

export const totalOwned = (card: Card) =>
	!!card
		? card.count +
			card.premiumCount +
			card.diamondCount +
			card.signatureCount +
			card.trialCount +
			card.trialPremiumCount +
			card.trialDiamondCount +
			card.trialSignatureCount
		: 0;
