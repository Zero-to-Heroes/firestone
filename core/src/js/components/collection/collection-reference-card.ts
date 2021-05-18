import { ReferenceCard } from '@firestone-hs/reference-data';

export interface CollectionReferenceCard extends ReferenceCard {
	readonly numberOwned: number;
}
