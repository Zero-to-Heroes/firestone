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
			...tooltipData.flexibleOptions,
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

	// Get the tribes that were actually assigned by the optimization algorithm
	const assignedTribes = new Set(uniqueTribes.map((tribe) => Race[tribe]));

	// Multi-tribe minions that still have unused potential (tribes not yet assigned)
	const unusedMultiTribes = allPlayedCards
		.filter((c) => c.races!.length > 1 && !c.races!.includes('ALL'))
		.map((c) => ({
			...c,
			availableRaces: c.races!.filter((raceStr) => !assignedTribes.has(raceStr)),
		}))
		.filter((c) => c.availableRaces.length > 0);

	// Tribes that are definitively secured (no multi-tribe minion can still contribute them)
	const unusedUniqueTribes = uniqueTribes.filter(
		(tribe) => !unusedMultiTribes.some((c) => c.availableRaces.includes(Race[tribe])),
	);

	return {
		uniqueTribes,
		securedTribes: unusedUniqueTribes.map((tribe) => Race[tribe].toLowerCase()),
		flexibleOptions: unusedMultiTribes.map((c) => c.availableRaces.map((r) => r.toLowerCase()).join('/')),
	};
}

type Mutable<T> = {
	-readonly [key in keyof T]: T[key];
};
