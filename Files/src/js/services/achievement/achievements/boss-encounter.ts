import { Challenge } from './challenge';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { GameEvent } from '../../../models/game-event';
import { DungeonInfo } from '../../../models/dungeon-info';

declare var parseCardsText;

export class BossEncounter implements Challenge {

	private achievementId: string;
	private bossId: string;
	private bossDbfId: number;
	private completed = false;

	constructor(achievement) {
		this.achievementId = achievement.id;
		this.bossId = achievement.bossId;
		this.bossDbfId = achievement.bossDbfId;
	}

	public detect(gameEvent: GameEvent, callback: Function) {
		if (this.completed) {
			return;
		}

		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}

		if (gameEvent.type === GameEvent.OPPONENT) {
			this.detectOpponentEvent(gameEvent, callback);
			return;
		}
		// Temp fix until we have GEP with match info
		else if (gameEvent.type === GameEvent.NEW_LOG_LINE) {
			// console.log('new log line', gameEvent);
			if (gameEvent.data[0].indexOf(this.bossId) != -1) {
				console.log('Achievement unlocked!', this.achievementId, this.bossId);
				this.completed = true;
				callback();
			}
			return;
		}
		// In case we miss the game start / end event, we check the info from memory
		else if (gameEvent.type === GameEvent.MAYBE_DUNGEON_INFO_PICK) {
			this.inspectMemory(gameEvent, callback);
			return;
		}
	}

	private detectOpponentEvent(gameEvent: GameEvent, callback: Function) {
		if (gameEvent.data[0].CardId == this.bossId) {
			// console.log('Achievement unlocked!', this.achievementId, this.bossId);
			callback();
		}
	}

	private inspectMemory(gameEvent: GameEvent, callback: Function) {
		let dungeonInfo: DungeonInfo = gameEvent.data[0];
		if (!dungeonInfo) {
			return;
		}
		dungeonInfo.DefeatedBosses.forEach((cardId) => {
			if (cardId === this.bossDbfId) {
				callback();
				return;
			}
		});
		if (dungeonInfo.NextBoss === this.bossDbfId) {
			callback();
			return;
		}
	}

	public getAchievementId() {
		console.log('returning achievement id', this.achievementId, this);
		return this.achievementId;
	}

	public defaultAchievement() {
		return new CompletedAchievement(this.achievementId);
	}
}
