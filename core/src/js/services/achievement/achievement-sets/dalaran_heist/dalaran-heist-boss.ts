import { FilterOption } from '../../../../models/filter-option';
import { VisualAchievement } from '../../../../models/visual-achievement';
import { GenericSetProvider } from '../generic-set-provider';

export class DalaranHeistBossSetProvider extends GenericSetProvider {
	constructor() {
		super(
			'dalaran_heist_boss',
			'Bosses',
			[
				'dalaran_heist_boss_DALA_BOSS_01h',
				'dalaran_heist_boss_DALA_BOSS_02h',
				'dalaran_heist_boss_DALA_BOSS_03h',
				'dalaran_heist_boss_DALA_BOSS_04h',
				'dalaran_heist_boss_DALA_BOSS_05h',
				'dalaran_heist_boss_DALA_BOSS_06h',
				'dalaran_heist_boss_DALA_BOSS_07h',
				'dalaran_heist_boss_DALA_BOSS_08h',
				'dalaran_heist_boss_DALA_BOSS_09h',
				'dalaran_heist_boss_DALA_BOSS_10h',
				'dalaran_heist_boss_DALA_BOSS_11h',
				'dalaran_heist_boss_DALA_BOSS_12h',
				'dalaran_heist_boss_DALA_BOSS_13h',
				'dalaran_heist_boss_DALA_BOSS_14h',
				'dalaran_heist_boss_DALA_BOSS_15h',
				'dalaran_heist_boss_DALA_BOSS_16h',
				'dalaran_heist_boss_DALA_BOSS_17h',
				'dalaran_heist_boss_DALA_BOSS_18h',
				'dalaran_heist_boss_DALA_BOSS_19h',
				'dalaran_heist_boss_DALA_BOSS_20h',
				'dalaran_heist_boss_DALA_BOSS_21h',
				'dalaran_heist_boss_DALA_BOSS_22h',
				'dalaran_heist_boss_DALA_BOSS_23h',
				'dalaran_heist_boss_DALA_BOSS_24h',
				'dalaran_heist_boss_DALA_BOSS_25h',
				'dalaran_heist_boss_DALA_BOSS_26h',
				'dalaran_heist_boss_DALA_BOSS_27h',
				'dalaran_heist_boss_DALA_BOSS_28h',
				'dalaran_heist_boss_DALA_BOSS_29h',
				'dalaran_heist_boss_DALA_BOSS_30h',
				'dalaran_heist_boss_DALA_BOSS_31h',
				'dalaran_heist_boss_DALA_BOSS_32h',
				'dalaran_heist_boss_DALA_BOSS_33h',
				'dalaran_heist_boss_DALA_BOSS_34h',
				'dalaran_heist_boss_DALA_BOSS_35h',
				'dalaran_heist_boss_DALA_BOSS_36h',
				'dalaran_heist_boss_DALA_BOSS_37h',
				'dalaran_heist_boss_DALA_BOSS_38h',
				'dalaran_heist_boss_DALA_BOSS_39h',
				'dalaran_heist_boss_DALA_BOSS_40h',
				'dalaran_heist_boss_DALA_BOSS_41h',
				'dalaran_heist_boss_DALA_BOSS_42h',
				'dalaran_heist_boss_DALA_BOSS_43h',
				'dalaran_heist_boss_DALA_BOSS_44h',
				'dalaran_heist_boss_DALA_BOSS_45h',
				'dalaran_heist_boss_DALA_BOSS_46h',
				'dalaran_heist_boss_DALA_BOSS_47h',
				'dalaran_heist_boss_DALA_BOSS_48h',
				'dalaran_heist_boss_DALA_BOSS_49h',
				'dalaran_heist_boss_DALA_BOSS_50h',
				'dalaran_heist_boss_DALA_BOSS_51h',
				'dalaran_heist_boss_DALA_BOSS_52h',
				'dalaran_heist_boss_DALA_BOSS_53h',
				'dalaran_heist_boss_DALA_BOSS_54h',
				'dalaran_heist_boss_DALA_BOSS_55h',
				'dalaran_heist_boss_DALA_BOSS_56h',
				'dalaran_heist_boss_DALA_BOSS_57h',
				'dalaran_heist_boss_DALA_BOSS_58h',
				'dalaran_heist_boss_DALA_BOSS_59h',
				'dalaran_heist_boss_DALA_BOSS_60h',
				'dalaran_heist_boss_DALA_BOSS_61h',
				'dalaran_heist_boss_DALA_BOSS_62h',
				'dalaran_heist_boss_DALA_BOSS_63h',
				'dalaran_heist_boss_DALA_BOSS_64h',
				'dalaran_heist_boss_DALA_BOSS_65h',
				'dalaran_heist_boss_DALA_BOSS_66h',
				'dalaran_heist_boss_DALA_BOSS_67h',
				'dalaran_heist_boss_DALA_BOSS_68h',
				'dalaran_heist_boss_DALA_BOSS_69h',
				'dalaran_heist_boss_DALA_BOSS_70h',
				'dalaran_heist_boss_DALA_BOSS_71h',
				'dalaran_heist_boss_DALA_BOSS_72h',
				'dalaran_heist_boss_DALA_BOSS_73h',
				'dalaran_heist_boss_DALA_BOSS_74h',
				'dalaran_heist_boss_DALA_BOSS_75h',
			],
			'achievements_boss',
		);
	}

	protected filterOptions(): readonly FilterOption[] {
		return [
			{
				value: 'ALL_ACHIEVEMENTS',
				label: 'All achievements',
				filterFunction: a => true,
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: 'Holy Moly, you are epic!',
				emptyStateText: '100% of achievements in this category complete.',
			},
			{
				value: 'NEVER_MET_NORMAL',
				label: 'Never met (normal)',
				filterFunction: (a: VisualAchievement) => a.completionSteps[0].numberOfCompletions === 0,
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: 'Holy Moly, you are epic!',
				emptyStateText: '100% of achievements in this category complete.',
			},
			{
				value: 'ENCOUNTERED_ONLY_NORMAL',
				label: 'Undefeated (normal)',
				filterFunction: (a: VisualAchievement) => {
					return a.completionSteps[1].numberOfCompletions === 0;
				},
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: 'Holy Moly, you are epic!',
				emptyStateText: '100% of achievements in this category complete.',
			},
			{
				value: 'NEVER_MET_HEROIC',
				label: 'Never met (heroic)',
				filterFunction: (a: VisualAchievement) => a.completionSteps[2].numberOfCompletions === 0,
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: 'Holy Moly, you are epic!',
				emptyStateText: '100% of achievements in this category complete.',
			},
			{
				value: 'ENCOUNTERED_ONLY_HEROIC',
				label: 'Undefeated (heroic)',
				filterFunction: (a: VisualAchievement) => {
					return a.completionSteps[3].numberOfCompletions === 0;
				},
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: 'Holy Moly, you are epic!',
				emptyStateText: '100% of achievements in this category complete.',
			},
			{
				value: 'ONLY_INCOMPLETE',
				label: 'Incomplete achievements',
				filterFunction: (a: VisualAchievement) => {
					return (
						a.completionSteps[0].numberOfCompletions === 0 ||
						a.completionSteps[1].numberOfCompletions === 0 ||
						a.completionSteps[2].numberOfCompletions === 0 ||
						a.completionSteps[3].numberOfCompletions === 0
					);
				},
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: 'Holy Moly, you are epic!',
				emptyStateText: '100% of achievements in this category complete.',
			},
			{
				value: 'ONLY_COMPLETED',
				label: 'Completed achievements',
				filterFunction: (a: VisualAchievement) => {
					return (
						a.completionSteps[0].numberOfCompletions > 0 &&
						a.completionSteps[1].numberOfCompletions > 0 &&
						a.completionSteps[2].numberOfCompletions > 0 &&
						a.completionSteps[3].numberOfCompletions > 0
					);
				},
				emptyStateIcon: 'empty_state_Only_cards_I_don’t_have_illustration',
				emptyStateTitle: 'Tons of achievements await you!',
				emptyStateText: 'Find them listed here once completed.',
			},
		];
	}
}
