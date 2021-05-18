import { Race, ReferenceCard } from '@firestone-hs/reference-data';

export interface BgsMinionsGroup {
	readonly tribe: Race;
	readonly minions: readonly ReferenceCard[];
	readonly highlightedMinions: readonly string[];
	readonly highlightedTribes: readonly Race[];
}
