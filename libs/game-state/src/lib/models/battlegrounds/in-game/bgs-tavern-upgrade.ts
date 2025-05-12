export class BgsTavernUpgrade {
	readonly turn: number;
	readonly tavernTier: number;

	public static create(base: BgsTavernUpgrade): BgsTavernUpgrade {
		return Object.assign(new BgsTavernUpgrade(), base);
	}
}
