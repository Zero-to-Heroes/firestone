import { BgsCardTier } from '@firestone/battlegrounds/data-access';

export interface BgsTimewarpedCardChoiceOption {
	readonly cardId: string;
	readonly tier: BgsCardTier | undefined;
	readonly dataPoints: number;
	readonly averagePlacement: number | null;
	readonly impact: number | null;
}

export const equalBgsTimewarpedCardChoiceOption = (
	a: BgsTimewarpedCardChoiceOption | null | undefined,
	b: BgsTimewarpedCardChoiceOption | null | undefined,
): boolean => {
	if (a === b) return true;
	if (!a || !b) return false;
	return (
		a.cardId === b.cardId &&
		a.dataPoints === b.dataPoints &&
		a.averagePlacement === b.averagePlacement &&
		a.impact === b.impact
	);
};
