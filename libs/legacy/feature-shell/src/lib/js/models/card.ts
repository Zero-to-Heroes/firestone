import { Card } from '@firestone/memory';

export const totalOwned = (card: Card) =>
	!!card ? card.count + card.premiumCount + card.diamondCount + card.signatureCount : 0;
