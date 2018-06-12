import { Challenge } from './challenge';
import { CompletedAchievement } from '../../../models/completed-achievement';
import { GameEvent } from '../../../models/game-event';
import { DungeonInfo } from '../../../models/dungeon-info';

declare var parseCardsText;

export class PassivePick implements Challenge {

	private achievementId: string;
	private passiveId: string;
	private passiveDbfId: number;

	constructor(achievement) {
		this.achievementId = achievement.id;
		this.passiveId = achievement.passiveId;
		this.passiveDbfId = achievement.passiveDbfId;
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
		if (lastTreasurePick == this.passiveDbfId) {
			// console.log('Achievement unlocked!', this.achievementId, this.passiveId);
			callback();
			return;
		}

		dungeonInfo.CurrentDeck.forEach((cardId) => {
			if (cardId == this.passiveDbfId) {
				// console.log('Achievement unlocked!', this.achievementId, this.passiveId);
				callback();
				return;
			}
		});
	}

	// public achieve(): Achievement {
	// 	let card = parseCardsText.getCard(this.passiveId);
	// 	let achievement: Achievement = new Achievement(this.achievementId, 'passive');
	// 	achievement.icon = `http://static.zerotoheroes.com/hearthstone/cardart/256/${this.passiveId}.jpg`;
	// 	achievement.order = parseInt(this.passiveId);
	// 	achievement.title = "Passive ability: " + card.name;
	// 	achievement.name = card.name;
	// 	achievement.htmlTooltip = `
	// 		<img src="http://static.zerotoheroes.com/hearthstone/fullcard/en/256/${this.passiveId}.png" />
	// 	`
	// 	return achievement;
	// }

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
