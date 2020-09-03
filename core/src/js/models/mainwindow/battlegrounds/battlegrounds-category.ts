export class BattlegroundsCategory {
	readonly id: string;
	readonly name: string;
	readonly icon: string;
	readonly enabled: boolean;
	readonly disabledTooltip?: string;

	public static create(base: BattlegroundsCategory): BattlegroundsCategory {
		return Object.assign(new BattlegroundsCategory(), base);
	}
}
