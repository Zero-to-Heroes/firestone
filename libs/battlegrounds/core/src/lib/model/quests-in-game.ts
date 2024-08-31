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
