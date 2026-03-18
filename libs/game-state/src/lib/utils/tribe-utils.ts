/**
 * Extracted from menagerie counter to break circular dependency:
 * _counter-definition-v2 -> utils -> card-utils -> cards -> mountain-map -> menagerie -> _counter-definition-v2
 *
 * This file has NO imports from counters - safe for cards/services to use.
 */
import { Race, ReferenceCard } from '@firestone-hs/reference-data';

type Mutable<T> = {
	-readonly [key in keyof T]: T[key];
};

// Extract the maximum number of unique tribes that can be achieved by optimally assigning multi-tribe minions.
// Single-tribe minions must use their tribe. Multi-tribe minions can choose which tribe to contribute.
// Goal: maximize the total number of unique tribes covered.
// Examples:
// - MURLOC + PIRATE + MURLOC/PIRATE → 2 unique tribes (MURLOC, PIRATE)
// - BEAST + MURLOC/PIRATE + MURLOC/UNDEAD + TOTEM → 4 unique tribes (BEAST, TOTEM, PIRATE, MURLOC or UNDEAD)
export const extractUniqueTribes = (allPlayedCards: readonly ReferenceCard[]): Race[] => {
	const minionsPlayedWithTribes = allPlayedCards.filter((c) => c.type === 'Minion').filter((c) => !!c.races?.length);
	const minionsToProcess: Mutable<ReferenceCard & { picked?: boolean }>[] = [
		...minionsPlayedWithTribes
			.filter((c) => !c.races!.includes('ALL'))
			.map((c) => ({ ...c, races: [...c.races!] })),
	];

	const uniqueTribes: Race[] = [];

	// Keep processing until no more minions can contribute
	let dirty = true;
	while (dirty) {
		dirty = false;

		// Sort unpicked minions by number of available races (most constrained first)
		const availableMinions = minionsToProcess
			.filter((m) => !m.picked && m.races!.length > 0)
			.sort((a, b) => a.races!.length - b.races!.length);

		for (const minion of availableMinions) {
			if (!minion.picked && minion.races!.length > 0) {
				// Choose the race that appears in the fewest other minions (scarcity heuristic)
				const raceScores = minion.races!.map((race) => {
					const count = minionsToProcess.filter((m) => !m.picked && m.races!.includes(race)).length;
					return { race, count };
				});

				// Sort by scarcity (lowest count first), then alphabetically for consistency
				raceScores.sort((a, b) => a.count - b.count || a.race.localeCompare(b.race));
				const raceToAdd = raceScores[0].race;

				uniqueTribes.push(Race[raceToAdd]);

				// Remove this race from all minions
				for (const m of minionsToProcess) {
					m.races = m.races!.filter((r) => r !== raceToAdd);
				}
				minion.picked = true;
				dirty = true;
				break; // Process one minion at a time, then re-sort
			}
		}
	}

	uniqueTribes.push(
		...minionsPlayedWithTribes
			.filter((m) => m.races!.includes('ALL'))
			.flatMap((m) => m.races!)
			.map((r: string) => Race[r as keyof typeof Race])
			.filter((r) => r !== undefined),
	);
	return uniqueTribes.filter((tribe) => tribe).sort();
};
