import { Achievement } from '../../../models/achievement';
import { FilterOption } from '../../../models/filter-option';
import { CompletionStep, VisualAchievement } from '../../../models/visual-achievement';
import { AchievementConfService } from '../achievement-conf.service';
import { AbstractBossSetProvider } from './boss-abstract';
import { IndexedVisualAchievement } from './set-provider';

export class DalaranHeistBossSetProvider extends AbstractBossSetProvider {
	constructor(conf: AchievementConfService) {
		super(
			'dalaran_heist_boss',
			'achievements_boss',
			'Bosses',
			[
				'dalaran_heist_boss_encounter',
				'dalaran_heist_boss_victory',
				'dalaran_heist_boss_encounter_heroic',
				'dalaran_heist_boss_victory_heroic',
			],
			conf,
		);
	}

	protected convertToVisual(achievement: Achievement, index: number, mergedAchievements: Achievement[]): IndexedVisualAchievement {
		// TODO: refactor
		const encountedId = this.types[0] + '_' + achievement.displayCardId;
		const victoryId = this.types[1] + '_' + achievement.displayCardId;
		const encounterHeroicId = this.types[2] + '_' + achievement.displayCardId;
		const victoryHeroicId = this.types[3] + '_' + achievement.displayCardId;
		const encounterAchievement = mergedAchievements.filter(ach => ach.id === encountedId)[0];
		const victoryAchievement = mergedAchievements.filter(ach => ach.id === victoryId)[0];
		const encounterHeroicAchievement = mergedAchievements.filter(ach => ach.id === encounterHeroicId)[0];
		const victoryHeroicAchievement = mergedAchievements.filter(ach => ach.id === victoryHeroicId)[0];
		const completionSteps = [
			{
				id: encountedId,
				numberOfCompletions: encounterAchievement.numberOfCompletions,
				iconSvgSymbol: this.conf.icon(encounterAchievement.type),
				text(showTimes: boolean = false): string {
					const times = showTimes ? `${encounterAchievement.numberOfCompletions} times` : ``;
					return `You met ${achievement.name} ${times}`;
				},
			} as CompletionStep,
			{
				id: victoryId,
				numberOfCompletions: victoryAchievement.numberOfCompletions,
				iconSvgSymbol: this.conf.icon(victoryAchievement.type),
				text(showTimes: boolean = false): string {
					const times = showTimes ? `${victoryAchievement.numberOfCompletions} times` : ``;
					return `You defeated ${achievement.name} ${times}`;
				},
			} as CompletionStep,
			{
				id: encounterHeroicId,
				numberOfCompletions: encounterHeroicAchievement.numberOfCompletions,
				iconSvgSymbol: this.conf.icon(encounterHeroicAchievement.type),
				text(showTimes: boolean = false): string {
					const times = showTimes ? `${encounterHeroicAchievement.numberOfCompletions} times` : ``;
					return `You met ${achievement.name} (Heroic) ${times}`;
				},
			} as CompletionStep,
			{
				id: victoryHeroicId,
				numberOfCompletions: victoryHeroicAchievement.numberOfCompletions,
				iconSvgSymbol: this.conf.icon(victoryHeroicAchievement.type),
				text(showTimes: boolean = false): string {
					const times = showTimes ? `${victoryHeroicAchievement.numberOfCompletions} times` : ``;
					return `You defeated ${achievement.name} (Heroic) ${times}`;
				},
			} as CompletionStep,
		];
		const replayInfo = [
			...(encounterAchievement.replayInfo || []),
			...(victoryAchievement.replayInfo || []),
			...(encounterHeroicAchievement.replayInfo || []),
			...(victoryHeroicAchievement.replayInfo || []),
		].sort((a, b) => a.creationTimestamp - b.creationTimestamp);
		const cardText = achievement.text || '...';
		const text = cardText
			.replace('<i>', '')
			.replace('</i>', '')
			.replace('[x]', '');
		return {
			achievement: new VisualAchievement(
				achievement.id,
				achievement.name,
				this.id,
				achievement.displayCardId,
				achievement.displayCardType,
				text,
				completionSteps,
				replayInfo,
			),
			index: index,
		};
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
