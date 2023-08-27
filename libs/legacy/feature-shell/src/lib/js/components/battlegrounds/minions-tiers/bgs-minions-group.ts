import { GameTag, Race } from '@firestone-hs/reference-data';
import { ExtendedReferenceCard } from './battlegrounds-minions-tiers-view.component';

export interface BgsMinionsGroup {
	readonly tribe: Race;
	readonly title: string;
	readonly minions: readonly ExtendedReferenceCard[];
	readonly highlightedMinions: readonly string[];
	readonly highlightedTribes: readonly Race[];
	readonly highlightedMechanics: readonly GameTag[];
}
