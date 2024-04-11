import { Sideboard } from '@firestone-hs/deckstrings';
import { GameFormatString } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@services/utils';

export class ConstructedDeckbuilder {
	readonly currentFormat: GameFormatString;
	readonly currentClass: string;
	readonly currentCards: readonly string[];
	readonly sideboards: Sideboard[];

	public update(base: Partial<NonFunctionProperties<ConstructedDeckbuilder>>): ConstructedDeckbuilder {
		return Object.assign(new ConstructedDeckbuilder(), this, base);
	}
}
