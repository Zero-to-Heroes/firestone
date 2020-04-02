export class BgsTriple {
	readonly turn: number;
	readonly tierOfTripledMinion: number;
	readonly cardId?: string;

	public static create(base: BgsTriple): BgsTriple {
		return Object.assign(new BgsTriple(), base);
	}
}
