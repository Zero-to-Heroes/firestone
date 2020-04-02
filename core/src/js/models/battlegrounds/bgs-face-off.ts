export class BgsFaceOff {
	turn: number;
	playerCardId: string;
	opponentCardId: string;
	// "won" means the "player" won
	result: string;
	damage: number;

	public static create(base: BgsFaceOff): BgsFaceOff {
		return Object.assign(new BgsFaceOff(), base);
	}
}
