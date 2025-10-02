/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { GameState, ShortCard } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class MenagerieCounterDefinitionV2 extends CounterDefinitionV2<readonly ShortCard[]> {
	public override id: CounterType = 'menagerie';
	public override image = CardIds.TheOneAmalgamBand;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.TheOneAmalgamBand,
		CardIds.PowerSlider,
		// CardIds.SpiritOfTheMountain_TLC_229, // Info is present when mousing over the quest
		CardIds.MountainMap_TLC_464,
	];

	readonly player = {
		pref: 'playerMenagerieCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.cardsPlayedThisMatch;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.menagerie-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.menagerie-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super();
	}

	protected override formatValue(value: readonly ShortCard[] | null | undefined): null | undefined | number | string {
		if (!value) {
			return null;
		}
		const allPlayedCards = value.map((c) => this.allCards.getCard(c.cardId));
		const uniqueTribes = extractUniqueTribes(allPlayedCards)
			.map((tribe) => this.i18n.translateString(`global.tribe.${Race[tribe].toLowerCase()}`))
			.sort();
		return uniqueTribes.length;
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
		countersUseExpandedView: boolean,
	): string | null {
		const value = this[side]?.value(gameState) ?? 0;
		if (!value) {
			return null;
		}
		const allPlayedCards = value.map((c) => this.allCards.getCard(c.cardId)).filter((c) => !!c.races?.length);

		const tooltipData = analyzeTooltipTribes(allPlayedCards);

		const tribesStr = [
			...tooltipData.securedTribes.map((tribe) =>
				this.i18n.translateString(`global.tribe.${tribe.toLowerCase()}`),
			),
			...tooltipData.flexibleOptions.map((option) =>
				option
					.split('/')
					.map((tribe) => this.i18n.translateString(`global.tribe.${tribe.toLowerCase()}`))
					.join('/'),
			),
		].sort();
		const tribeText = countersUseExpandedView ? '<br/>' + tribesStr?.join('<br/>') : tribesStr.join(', ');
		const tooltip = this.i18n.translateString(`counters.menagerie.${side}`, {
			value: tribeText,
		});
		return tooltip;
	}
}

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

// Analyze tooltip tribes - extracted for testability
export function analyzeTooltipTribes(allPlayedCards: readonly ReferenceCard[]): {
	uniqueTribes: Race[];
	securedTribes: string[];
	flexibleOptions: string[];
} {
	const uniqueTribes = extractUniqueTribes(allPlayedCards);

	// All tribes that are secured by the optimal algorithm assignment
	const allSecuredTribes = uniqueTribes.map((tribe) => Race[tribe].toLowerCase());

	// Single-tribe minions (always secured) - include ALL minions
	const singleTribeMinions = allPlayedCards
		.filter((c) => c.races!.length === 1)
		.map((c) => c.races![0].toLowerCase())
		// Remove duplicates
		.filter((tribe, index, self) => self.indexOf(tribe) === index);

	// Determine which multi-tribe minions have true strategic flexibility
	const securedBySingles = new Set(singleTribeMinions);
	const allSecuredSet = new Set(allSecuredTribes);

	const flexibleMultiTribes: string[] = [];
	let hasAnyTrueFlexibility = false;

	for (const card of allPlayedCards) {
		if (card.races!.length <= 1 || card.races!.includes('ALL')) continue;

		const cardTribes = card.races!.map((r) => r.toLowerCase());

		// A multi-tribe minion is flexible only if:
		// 1. It has multiple tribes not secured by singles, AND
		// 2. There could be strategic value in showing it (i.e., not all its tribes are already secured)

		const nonSecuredBySingles = cardTribes.filter((tribe) => !securedBySingles.has(tribe));
		const nonSecuredByAlgorithm = cardTribes.filter((tribe) => !allSecuredSet.has(tribe));

		// Check if this minion has multiple non-secured options (true flexibility)
		const hasMultipleOptions = nonSecuredBySingles.length > 1;

		// Only show as flexible if there are multiple viable choices
		if (hasMultipleOptions) {
			const combo = cardTribes.join('/');
			if (!flexibleMultiTribes.includes(combo)) {
				flexibleMultiTribes.push(combo);
			}
			hasAnyTrueFlexibility = true;
		}
	}

	// Calculate theoretical maximum tribes possible with these minions
	const allPossibleTribes = new Set<string>();
	for (const card of allPlayedCards) {
		if (card.races!.includes('ALL')) continue; // Skip ALL for this calculation
		for (const race of card.races!) {
			allPossibleTribes.add(race.toLowerCase());
		}
	}

	const theoreticalMax = allPossibleTribes.size;
	const actualAchieved = uniqueTribes.length;

	// Determine final output based on whether we've achieved theoretical maximum
	let finalSecuredTribes: string[];
	let finalFlexibleOptions: string[];

	// Determine output based on constraint analysis
	if (hasAnyTrueFlexibility) {
		// Check if we have single-tribe minions that create constraints
		const hasSingleTribes = singleTribeMinions.length > 0;

		if (hasSingleTribes) {
			// We have single-tribe constraints - analyze forced assignments
			const forcedTribes = new Set(singleTribeMinions);
			let hasAnyRemainingFlexibility = false;

			// Add tribes that are forced because multi-tribe minions have only one viable option
			for (const card of allPlayedCards) {
				if (card.races!.length <= 1) continue;
				if (card.races!.includes('ALL')) continue; // Skip ALL multi-tribe minions for constraint analysis

				const cardTribes = card.races!.map((r) => r.toLowerCase());
				const availableOptions = cardTribes.filter((tribe) => !securedBySingles.has(tribe));

				// If this multi-tribe minion has only one viable option, that tribe is forced
				if (availableOptions.length === 1) {
					forcedTribes.add(availableOptions[0]);
				} else if (availableOptions.length > 1) {
					// This multi-tribe minion still has multiple viable options
					hasAnyRemainingFlexibility = true;
				}
			}

			// Check if we should suppress flexibility
			const multiTribeCount = allPlayedCards.filter(
				(c) => c.races!.length > 1 && !c.races!.includes('ALL'),
			).length;
			const shouldSuppressFlexibility =
				!hasAnyRemainingFlexibility ||
				(actualAchieved >= theoreticalMax && (singleTribeMinions.length > 1 || multiTribeCount >= 5));

			if (shouldSuppressFlexibility) {
				// All multi-tribe assignments are forced - show all algorithm tribes as secured
				finalSecuredTribes = allSecuredTribes;
				finalFlexibleOptions = [];
			} else {
				// Some multi-tribes still have multiple options - show flexibility
				finalSecuredTribes = Array.from(forcedTribes);
				finalFlexibleOptions = flexibleMultiTribes;
			}
		} else {
			// No single-tribe constraints - check if we achieve theoretical maximum
			const allMultiTribesForced = actualAchieved >= theoreticalMax;

			if (allMultiTribesForced) {
				// Maximum achieved with only multi-tribes - all assignments are forced
				finalSecuredTribes = allSecuredTribes;
				finalFlexibleOptions = [];
			} else {
				// Not at maximum - show flexibility
				finalSecuredTribes = singleTribeMinions;
				finalFlexibleOptions = flexibleMultiTribes;
			}
		}
	} else {
		// No flexibility detected - show all as secured
		finalSecuredTribes = allSecuredTribes;
		finalFlexibleOptions = [];
	}

	return {
		uniqueTribes,
		securedTribes: finalSecuredTribes,
		flexibleOptions: finalFlexibleOptions,
	};
}

type Mutable<T> = {
	-readonly [key in keyof T]: T[key];
};
