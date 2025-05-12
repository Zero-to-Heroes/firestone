import { BgsBoard as IBgsBoard, Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';

export class BgsBoard implements IBgsBoard {
	readonly turn: number;
	readonly board: readonly Entity[] = [];

	public static create(base: BgsBoard): BgsBoard {
		return Object.assign(new BgsBoard(), base);
	}
}
