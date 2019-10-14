import { GenericSetProvider } from '../generic-set-provider';

export class TombsOfTerrorBossSetProvider extends GenericSetProvider {
	constructor() {
		super(
			'tombs_of_terror_boss',
			'Bosses',
			[
				'tombs_of_terror_boss_ULDA_BOSS_01h',
				'tombs_of_terror_boss_ULDA_BOSS_02h',
				'tombs_of_terror_boss_ULDA_BOSS_03h',
				'tombs_of_terror_boss_ULDA_BOSS_04h',
				'tombs_of_terror_boss_ULDA_BOSS_05h',
				'tombs_of_terror_boss_ULDA_BOSS_06h',
				'tombs_of_terror_boss_ULDA_BOSS_07h',
				'tombs_of_terror_boss_ULDA_BOSS_08h',
				'tombs_of_terror_boss_ULDA_BOSS_09h',
				'tombs_of_terror_boss_ULDA_BOSS_10h',
				'tombs_of_terror_boss_ULDA_BOSS_11h',
				'tombs_of_terror_boss_ULDA_BOSS_12h',
				'tombs_of_terror_boss_ULDA_BOSS_13h',
				'tombs_of_terror_boss_ULDA_BOSS_14h',
				'tombs_of_terror_boss_ULDA_BOSS_15h',
				'tombs_of_terror_boss_ULDA_BOSS_16h',
				'tombs_of_terror_boss_ULDA_BOSS_17h',
				'tombs_of_terror_boss_ULDA_BOSS_18h',
				'tombs_of_terror_boss_ULDA_BOSS_19h',
				'tombs_of_terror_boss_ULDA_BOSS_20h',
				'tombs_of_terror_boss_ULDA_BOSS_21h',
				'tombs_of_terror_boss_ULDA_BOSS_22h',
				'tombs_of_terror_boss_ULDA_BOSS_23h',
				'tombs_of_terror_boss_ULDA_BOSS_24h',
				'tombs_of_terror_boss_ULDA_BOSS_25h',
				'tombs_of_terror_boss_ULDA_BOSS_26h',
				'tombs_of_terror_boss_ULDA_BOSS_27h',
				'tombs_of_terror_boss_ULDA_BOSS_28h',
				'tombs_of_terror_boss_ULDA_BOSS_29h',
				'tombs_of_terror_boss_ULDA_BOSS_30h',
				'tombs_of_terror_boss_ULDA_BOSS_31h',
				'tombs_of_terror_boss_ULDA_BOSS_32h',
				'tombs_of_terror_boss_ULDA_BOSS_33h',
				'tombs_of_terror_boss_ULDA_BOSS_34h',
				'tombs_of_terror_boss_ULDA_BOSS_35h',
				'tombs_of_terror_boss_ULDA_BOSS_36h',
				'tombs_of_terror_boss_ULDA_BOSS_41h',
				'tombs_of_terror_boss_ULDA_BOSS_42h',
				'tombs_of_terror_boss_ULDA_BOSS_43h',
				'tombs_of_terror_boss_ULDA_BOSS_44h',
				'tombs_of_terror_boss_ULDA_BOSS_45h',
				'tombs_of_terror_boss_ULDA_BOSS_46h',
				'tombs_of_terror_boss_ULDA_BOSS_47h',
				'tombs_of_terror_boss_ULDA_BOSS_48h',
				'tombs_of_terror_boss_ULDA_BOSS_49h',
				'tombs_of_terror_boss_ULDA_BOSS_50h',
				'tombs_of_terror_boss_ULDA_BOSS_51h',
				'tombs_of_terror_boss_ULDA_BOSS_52h',
				'tombs_of_terror_boss_ULDA_BOSS_53h',
				'tombs_of_terror_boss_ULDA_BOSS_54h',
				'tombs_of_terror_boss_ULDA_BOSS_55h',
				'tombs_of_terror_boss_ULDA_BOSS_56h',
				'tombs_of_terror_boss_ULDA_BOSS_57h',
				'tombs_of_terror_boss_ULDA_BOSS_58h',
				'tombs_of_terror_boss_ULDA_BOSS_59h',
				'tombs_of_terror_boss_ULDA_BOSS_60h',
				'tombs_of_terror_boss_ULDA_BOSS_61h',
				'tombs_of_terror_boss_ULDA_BOSS_62h',
				'tombs_of_terror_boss_ULDA_BOSS_63h',
				'tombs_of_terror_boss_ULDA_BOSS_65h',
				'tombs_of_terror_boss_ULDA_BOSS_66h',
				'tombs_of_terror_boss_ULDA_BOSS_68h',
				'tombs_of_terror_boss_ULDA_BOSS_69h',
				'tombs_of_terror_boss_ULDA_BOSS_70h',
				'tombs_of_terror_boss_ULDA_BOSS_71h',
				'tombs_of_terror_boss_ULDA_BOSS_72h',
				'tombs_of_terror_boss_ULDA_BOSS_73h',
				'tombs_of_terror_boss_ULDA_BOSS_74h',
				'tombs_of_terror_boss_ULDA_BOSS_75h',
				'tombs_of_terror_boss_ULDA_BOSS_76h',
				'tombs_of_terror_boss_ULDA_BOSS_77h',
				'tombs_of_terror_boss_ULDA_BOSS_78h',
				'tombs_of_terror_boss_ULDA_BOSS_79h',
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
