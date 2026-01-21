export interface BgsTimewarpedCardChoiceOption {
	readonly cardId: string;
	readonly dataPoints: number;
	readonly averagePlacement: number;
	readonly impact: number;
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
