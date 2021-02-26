import { ReferenceCard } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-card';

export interface CollectionReferenceCard extends ReferenceCard {
	readonly numberOwned: number;
}
