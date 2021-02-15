import { Race } from '@firestone-hs/reference-data';
import { ReferenceCard } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-card';

export interface BgsMinionsGroup {
	readonly tribe: Race;
	readonly minions: readonly ReferenceCard[];
	readonly highlightedMinions: readonly string[];
}
