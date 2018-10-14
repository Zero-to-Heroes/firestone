import { Challenge } from './challenge';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { GameEvent } from '../../../models/game-event';
import { DungeonInfo } from '../../../models/dungeon-info';

declare var parseCardsText;

export class TreasurePick implements Challenge {

	private achievementId: string;
	private treasureId: string;
	private treasureDbfId: number;

	constructor(achievement) {
		this.achievementId = achievement.id;
		this.treasureId = achievement.treasureId;
		this.treasureDbfId = achievement.treasureDbfId;
	}

	public detect(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.type !== GameEvent.MAYBE_DUNGEON_INFO_PICK) {
			return;
		}

		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}

		let dungeonInfo: DungeonInfo = gameEvent.data[0];
		let lastTreasurePick: number = this.getLastTreasurePick(dungeonInfo);
		if (lastTreasurePick == this.treasureDbfId) {
			// console.log('Achievement unlocked!', this.achievementId, this.treasureId);
			callback();
			return;
		}

		dungeonInfo.CurrentDeck.forEach((cardId) => {
			if (cardId == this.treasureDbfId) {
				// console.log('Achievement unlocked!', this.achievementId, this.treasureId);
				callback();
				return;
			}
		});
	}

	private getLastTreasurePick(dungeonInfo: DungeonInfo): number {
		if (!dungeonInfo.TreasureOptions || dungeonInfo.TreasureOptions.length == 0) {
			return null;
		}
		if (!dungeonInfo.ChosenTreasure || dungeonInfo.ChosenTreasure <= 0) {
			return null;
		}

		return dungeonInfo.TreasureOptions[dungeonInfo.ChosenTreasure - 1];
	}

	getAchievementId() {
		return this.achievementId;
	}

	defaultAchievement() {
		return new CompletedAchievement(this.achievementId);
	}
}
