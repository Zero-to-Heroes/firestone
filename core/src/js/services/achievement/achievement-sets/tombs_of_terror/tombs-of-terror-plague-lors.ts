import { GenericSetProvider } from '../generic-set-provider';

export class TombsOfTerrorPlagueLordsProvider extends GenericSetProvider {
	constructor() {
		super(
			'tombs_of_terror_plague_lords',
			'Plague Lords',
			[
				'tombs_of_terror_boss_ULDA_BOSS_37h',
				'tombs_of_terror_boss_ULDA_BOSS_38h',
				'tombs_of_terror_boss_ULDA_BOSS_39h',
				'tombs_of_terror_boss_ULDA_BOSS_40h',
				'tombs_of_terror_boss_ULDA_BOSS_67h',
			],
			'achievements_boss',
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
