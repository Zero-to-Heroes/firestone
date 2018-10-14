import { Challenge } from './challenge';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { GameEvent } from '../../../models/game-event';
import { Game } from '../../../models/game';
import { DungeonInfo } from '../../../models/dungeon-info';

declare var parseCardsText;

export class BossVictory implements Challenge {

	private achievementId: string;
	private bossId: string;
	private bossDbfId: number;

	constructor(achievement) {
		this.achievementId = achievement.id;
		this.bossId = achievement.bossId;
		this.bossDbfId = achievement.bossDbfId;
	}

	public detect(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}

		if (gameEvent.type === GameEvent.WINNER) {
			this.detectGameResultEvent(gameEvent, callback);
			return;
		}
		// In case we miss the game start / end event, we check the info from memory
		else if (gameEvent.type === GameEvent.MAYBE_DUNGEON_INFO_PICK) {
			this.inspectMemory(gameEvent, callback);
			return;
		}
	}

	private detectGameResultEvent(gameEvent: GameEvent, callback: Function) {
		let winner = gameEvent.data[0];
		let localPlayer = gameEvent.data[1];
		let opponentPlayer = gameEvent.data[2];

		if (opponentPlayer.CardID === this.bossId && localPlayer.Id === winner.Id) {
			console.log('Achievement unlocked!', this.achievementId, this.bossId);
			callback();
		}
	}

	private inspectMemory(gameEvent: GameEvent, callback: Function) {
		let dungeonInfo: DungeonInfo = gameEvent.data[0];
		dungeonInfo.DefeatedBosses.forEach((cardId) => {
			if (cardId === this.bossDbfId) {
				callback();
				return;
			}
		});
	}

	public getAchievementId() {
		return this.achievementId;
	}

	public defaultAchievement() {
		return new CompletedAchievement(this.achievementId);
	}
}
