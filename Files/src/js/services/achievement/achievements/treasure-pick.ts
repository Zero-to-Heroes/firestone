import { Challenge } from './challenge';
import { Achievement } from '../../../models/achievement';
import { GameEvent } from '../../../models/game-event';
import { DungeonInfo } from '../../../models/dungeon-info';

declare var parseCardsText;

export class TreasurePick implements Challenge {

	private achievementId: string;
	private treasureId: string;
	private treasureDbfId: number;

	constructor(achievementId: string, treasureId: string, treasureDbfId: number) {
		this.achievementId = achievementId;
		this.treasureId = treasureId;
		this.treasureDbfId = treasureDbfId;
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

	public achieve(): Achievement {
		let card = parseCardsText.getCard(this.treasureId);
		let achievement: Achievement = new Achievement(this.achievementId, 'treasure');
		achievement.icon = `https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/cardart/256x/${this.treasureId}.jpg`;
		achievement.order = parseInt(this.treasureId);
		achievement.title = "Passive ability: " + card.name;
		achievement.name = card.name;
		achievement.htmlTooltip = `
			<img src="https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/fullcards/en/256/${this.treasureId}.png" />
		`
		return achievement;
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
}
