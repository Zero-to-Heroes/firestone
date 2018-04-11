import { Challenge } from './challenge';
import { Achievement } from '../../../models/achievement';
import { GameEvent } from '../../../models/game-event';
import { DungeonInfo } from '../../../models/dungeon-info';

declare var parseCardsText;

export class BossEncounter implements Challenge {

	private achievementId: string;
	private bossId: string;
	private bossDbfId: number;

	constructor(achievementId: string, bossId: string, bossDbfId) {
		this.achievementId = achievementId;
		this.bossId = bossId;
		this.bossDbfId = bossDbfId;
	}

	public detect(gameEvent: GameEvent, callback: Function) {
		if (!gameEvent.data || gameEvent.data.length == 0) {
			return;
		}

		if (gameEvent.type === GameEvent.OPPONENT) {
			this.detectOpponentEvent(gameEvent, callback);
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

	public achieve(): Achievement {
		let card = parseCardsText.getCard(this.bossId);
		let achievement: Achievement = new Achievement(this.achievementId, 'boss_encounter');
		achievement.icon = `http://static.zerotoheroes.com/hearthstone/cardart/256/${this.bossId}.jpg`;
		achievement.order = card.health / 10;
		achievement.title = "A new encounter: " + card.name;
		achievement.name = card.name;
		achievement.htmlTooltip = `
			<img src="http://static.zerotoheroes.com/hearthstone/fullcard/en/256/${this.bossId}.png" />
		`
		return achievement;
	}
}
