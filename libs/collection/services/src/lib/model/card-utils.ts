import { Card } from '@firestone/memory';

export const totalOwned = (card: Card) =>
	!!card
		? (card.count ?? 0) +
			(card.premiumCount ?? 0) +
			(card.diamondCount ?? 0) +
			(card.signatureCount ?? 0) +
			(card.trialCount ?? 0) +
			(card.trialPremiumCount ?? 0) +
			(card.trialDiamondCount ?? 0) +
			(card.trialSignatureCount ?? 0)
		: 0;
