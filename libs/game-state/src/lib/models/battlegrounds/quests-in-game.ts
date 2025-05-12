export interface BgsQuestCardChoiceOption {
	readonly cardId: string;
	readonly quest: {
		readonly dataPoints: number;
		readonly heroDataPoints: number;
		readonly difficultyDataPoints: number;
		readonly averageTurnsToComplete: number;
		readonly averageTurnsToCompleteForHero: number | null;
		readonly averageTurnsToCompleteForDifficulty: number | null;
	};
	readonly reward: {
		// readonly tier: string;
		readonly dataPoints: number;
		readonly averagePosition: number;
		readonly heroDataPoints: number;
		readonly averagePositionForHero: number | null;
	};
}
export const equalBgsQuestCardChoiceOption = (
	a: BgsQuestCardChoiceOption | null | undefined,
	b: BgsQuestCardChoiceOption | null | undefined,
): boolean => {
	if (a === b) return true;
	if (!a || !b) return false;
	return (
		a.cardId === b.cardId &&
		a.quest.dataPoints === b.quest.dataPoints &&
		a.quest.heroDataPoints === b.quest.heroDataPoints &&
		a.quest.difficultyDataPoints === b.quest.difficultyDataPoints &&
		a.quest.averageTurnsToComplete === b.quest.averageTurnsToComplete &&
		a.quest.averageTurnsToCompleteForHero === b.quest.averageTurnsToCompleteForHero &&
		a.quest.averageTurnsToCompleteForDifficulty === b.quest.averageTurnsToCompleteForDifficulty &&
		a.reward.dataPoints === b.reward.dataPoints &&
		a.reward.heroDataPoints === b.reward.heroDataPoints &&
		a.reward.averagePosition === b.reward.averagePosition &&
		a.reward.averagePositionForHero === b.reward.averagePositionForHero
	);
};
