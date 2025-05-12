export interface BgsTrinketCardChoiceOption {
	readonly cardId: string;
	readonly dataPoints: number;
	readonly pickRate: number;
	readonly pickRateTop25: number;
	readonly averagePlacement: number;
	readonly averagePlacementTop25: number;
}
export const equalBgsTrinketCardChoiceOption = (
	a: BgsTrinketCardChoiceOption | null | undefined,
	b: BgsTrinketCardChoiceOption | null | undefined,
): boolean => {
	if (a === b) return true;
	if (!a || !b) return false;
	return (
		a.cardId === b.cardId &&
		a.dataPoints === b.dataPoints &&
		a.pickRate === b.pickRate &&
		a.pickRateTop25 === b.pickRateTop25 &&
		a.averagePlacement === b.averagePlacement &&
		a.averagePlacementTop25 === b.averagePlacementTop25
	);
};
