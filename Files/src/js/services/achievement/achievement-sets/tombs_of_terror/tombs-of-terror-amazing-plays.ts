import { GenericSetProvider } from '../generic-set-provider';

export class TombsOfTerrorAmazingPlaysSetProvider extends GenericSetProvider {
	constructor() {
		super(
			'tombs_of_terror_amazing_plays',
			'Amazing Plays',
			[
				'tombs_of_terror_amazing_plays_aegis_bulwark',
				'tombs_of_terror_amazing_plays_fatigue_vash',
				'tombs_of_terror_amazing_plays_full_tinyfin',
				'tombs_of_terror_amazing_plays_gatling_wand',
				'tombs_of_terror_amazing_plays_high_attack_minion',
				'tombs_of_terror_amazing_plays_legendary_seven_copies_on_board',
				'tombs_of_terror_amazing_plays_unstoppable_ULDA_BOSS_37h',
				'tombs_of_terror_amazing_plays_unstoppable_ULDA_BOSS_38h',
				'tombs_of_terror_amazing_plays_unstoppable_ULDA_BOSS_39h',
				'tombs_of_terror_amazing_plays_unstoppable_ULDA_BOSS_40h',
				'tombs_of_terror_amazing_plays_unstoppable_ULDA_BOSS_67h',
			],
			'achievements_shrine',
		);
	}

	// protected filterOptions(): readonly FilterOption[] {
	// 	return [
	// 		{
	// 			value: 'ALL_ACHIEVEMENTS',
	// 			label: 'All achievements',
	// 			filterFunction: a => true,
	// 			emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
	// 			emptyStateTitle: 'Holy Moly, you are epic!',
	// 			emptyStateText: '100% of achievements in this category complete.',
	// 		},
	// 		{
	// 			value: 'NEVER_MET_NORMAL',
	// 			label: 'Never met (normal)',
	// 			filterFunction: (a: VisualAchievement) => a.completionSteps[0].numberOfCompletions === 0,
	// 			emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
	// 			emptyStateTitle: 'Holy Moly, you are epic!',
	// 			emptyStateText: '100% of achievements in this category complete.',
	// 		},
	// 		{
	// 			value: 'ENCOUNTERED_ONLY_NORMAL',
	// 			label: 'Undefeated (normal)',
	// 			filterFunction: (a: VisualAchievement) => {
	// 				return a.completionSteps[1].numberOfCompletions === 0;
	// 			},
	// 			emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
	// 			emptyStateTitle: 'Holy Moly, you are epic!',
	// 			emptyStateText: '100% of achievements in this category complete.',
	// 		},
	// 		{
	// 			value: 'NEVER_MET_HEROIC',
	// 			label: 'Never met (heroic)',
	// 			filterFunction: (a: VisualAchievement) => a.completionSteps[2].numberOfCompletions === 0,
	// 			emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
	// 			emptyStateTitle: 'Holy Moly, you are epic!',
	// 			emptyStateText: '100% of achievements in this category complete.',
	// 		},
	// 		{
	// 			value: 'ENCOUNTERED_ONLY_HEROIC',
	// 			label: 'Undefeated (heroic)',
	// 			filterFunction: (a: VisualAchievement) => {
	// 				return a.completionSteps[3].numberOfCompletions === 0;
	// 			},
	// 			emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
	// 			emptyStateTitle: 'Holy Moly, you are epic!',
	// 			emptyStateText: '100% of achievements in this category complete.',
	// 		},
	// 		{
	// 			value: 'ONLY_INCOMPLETE',
	// 			label: 'Incomplete achievements',
	// 			filterFunction: (a: VisualAchievement) => {
	// 				return (
	// 					a.completionSteps[0].numberOfCompletions === 0 ||
	// 					a.completionSteps[1].numberOfCompletions === 0 ||
	// 					a.completionSteps[2].numberOfCompletions === 0 ||
	// 					a.completionSteps[3].numberOfCompletions === 0
	// 				);
	// 			},
	// 			emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
	// 			emptyStateTitle: 'Holy Moly, you are epic!',
	// 			emptyStateText: '100% of achievements in this category complete.',
	// 		},
	// 		{
	// 			value: 'ONLY_COMPLETED',
	// 			label: 'Completed achievements',
	// 			filterFunction: (a: VisualAchievement) => {
	// 				return (
	// 					a.completionSteps[0].numberOfCompletions > 0 &&
	// 					a.completionSteps[1].numberOfCompletions > 0 &&
	// 					a.completionSteps[2].numberOfCompletions > 0 &&
	// 					a.completionSteps[3].numberOfCompletions > 0
	// 				);
	// 			},
	// 			emptyStateIcon: 'empty_state_Only_cards_I_don’t_have_illustration',
	// 			emptyStateTitle: 'Tons of achievements await you!',
	// 			emptyStateText: 'Find them listed here once completed.',
	// 		},
	// 	];
	// }
}
