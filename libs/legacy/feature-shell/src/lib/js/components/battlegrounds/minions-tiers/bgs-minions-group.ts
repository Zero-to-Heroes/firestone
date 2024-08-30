import { GameTag, Race } from '@firestone-hs/reference-data';
import { ExtendedReferenceCard } from '@firestone/battlegrounds/core';

export interface BgsMinionsGroup {
	readonly tribe: Race;
	readonly title: string;
	readonly minions: readonly ExtendedReferenceCard[];
	readonly highlightedMinions: readonly string[];
	readonly highlightedTribes: readonly Race[];
	readonly highlightedMechanics: readonly GameTag[];
}
