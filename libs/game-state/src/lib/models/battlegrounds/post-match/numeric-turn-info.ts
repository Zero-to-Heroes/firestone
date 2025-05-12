export class NumericTurnInfo {
	readonly turn: number;
	readonly value: number;
}
export const equalNumericTurnInfo = (
	a: NumericTurnInfo | null | undefined,
	b: NumericTurnInfo | null | undefined,
): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.turn !== b.turn) {
		return false;
	}
	if (a.value !== b.value) {
		return false;
	}
	return true;
};
