import { CardClass } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';

export class HeroCard {
	readonly name: string;
	readonly cardId: string;
	readonly entityId: number;
	readonly playerName: string;
	readonly classes: readonly CardClass[] = [];
	readonly maxHealth: number;
	readonly manaLeft: number;

	public static create(base: Partial<NonFunctionProperties<HeroCard>>): HeroCard {
		return Object.assign(new HeroCard(), base);
	}

	public update(base: Partial<NonFunctionProperties<HeroCard>>): HeroCard {
		return Object.assign(new HeroCard(), this, base);
	}
}
