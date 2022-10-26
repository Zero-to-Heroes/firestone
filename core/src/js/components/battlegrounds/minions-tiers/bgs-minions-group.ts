import { GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';

export interface BgsMinionsGroup {
	readonly tribe: Race;
	readonly title: string;
	readonly minions: readonly ReferenceCard[];
	readonly highlightedMinions: readonly string[];
	readonly highlightedTribes: readonly Race[];
	readonly highlightedMechanics: readonly GameTag[];
}
