import { Entity } from '@firestone-hs/replay-parser';

export class BgsBoard {
	readonly turn: number;
	readonly board: readonly Entity[] = [];

	public static create(base: BgsBoard): BgsBoard {
		return Object.assign(new BgsBoard(), base);
	}
}
