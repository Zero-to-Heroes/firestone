import { CardClass } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';

export class HeroCard {
	readonly name: string;
	readonly cardId: string;
	readonly entityId: number;
	readonly playerName: string;
	// So that we can still keep track of cards that might be in the deck if the hero class changes
	// (eg becoming NEUTRAL with Reno)
	readonly initialClasses: readonly CardClass[] = [];
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

export const hasOrHadHeroClass = (card: HeroCard | undefined, cardClasses: readonly CardClass[]): boolean => {
	return (
		card?.initialClasses.some((c) => cardClasses.includes(c)) ||
		card?.classes.some((c) => cardClasses.includes(c)) ||
		false
	);
};
