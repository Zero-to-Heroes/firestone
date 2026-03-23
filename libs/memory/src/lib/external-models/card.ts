export interface Card {
	readonly id: string;
	readonly count: number;
	readonly premiumCount: number;
	readonly diamondCount: number;
	readonly signatureCount: number;
	readonly trialCount: number;
	readonly trialPremiumCount: number;
	readonly trialDiamondCount: number;
	readonly trialSignatureCount: number;
}
