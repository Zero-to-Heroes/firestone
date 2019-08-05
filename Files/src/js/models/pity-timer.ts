export class PityTimer {
	readonly setId: string;
	readonly packsUntilGuaranteedEpic: number;
	readonly packsUntilGuaranteedLegendary: number;

	constructor(setId: string, packsUntilGuaranteedEpic: number, packsUntilGuaranteedLegendary: number) {
		this.setId = setId;
		this.packsUntilGuaranteedEpic = packsUntilGuaranteedEpic;
		this.packsUntilGuaranteedLegendary = packsUntilGuaranteedLegendary;
	}
}
