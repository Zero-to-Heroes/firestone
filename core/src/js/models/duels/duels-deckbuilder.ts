import { CardClass } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@services/utils';

export class DuelsDeckbuilder {
	readonly currentHeroCardId: string;
	readonly currentHeroPowerCardId: string;
	readonly currentSignatureTreasureCardId: string;
	readonly currentCards: readonly string[];
	readonly currentClasses: CardClass[] = [];

	public update(base: Partial<NonFunctionProperties<DuelsDeckbuilder>>): DuelsDeckbuilder {
		return Object.assign(new DuelsDeckbuilder(), this, base);
	}
}
