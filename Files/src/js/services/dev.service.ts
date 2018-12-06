import { Injectable } from '@angular/core';
import { AchievementsMonitor } from './achievement/achievements-monitor.service';
import { Achievement } from '../models/achievement';
import { AchievementsStorageService } from './achievement/achievements-storage.service';
import { CompletedAchievement } from '../models/completed-achievement';
import { PackMonitor } from './collection/pack-monitor.service';
import { Card } from '../models/card';

declare var overwolf: any;

@Injectable()
export class DevService {

	constructor(
		private achievementMonitor: AchievementsMonitor, 
		private packMonitor: PackMonitor,
		private storage: AchievementsStorageService) {
		this.addTestCommands();
	}

	private addTestCommands() {
		this.addCollectionCommands();
		this.addAchievementCommands();
	}

	private addAchievementCommands() {
		const achievement = new Achievement(
			'dungeon_run_boss_encounter_LOOTA_BOSS_44h',
			'Fake Wee Whelp',
			'dungeon_run_boss_encounter',
			'LOOTA_BOSS_44h',
			'common',
			1,
			[]
		)
		window['showAchievementNotification'] = () => {			
			this.achievementMonitor.sendPreRecordNotification(achievement, 20000);
			setTimeout(() => this.achievementMonitor.sendPostRecordNotification(achievement), 500);
		}
		window['addAchievementHistory'] = () => {
			this.achievementMonitor.storeNewAchievementHistory(achievement, 1);
		}
		window['addReplayInfos'] = async () => {
			const achievements = await this.storage.loadAchievements();
			const achievement = achievements
					.filter((ach) => ach.replayInfo && ach.replayInfo.length > 0)
					[0];
			const newReplays = [
				...achievement.replayInfo, 
				achievement.replayInfo[0],
				achievement.replayInfo[0],
				achievement.replayInfo[0],
				achievement.replayInfo[0],
				achievement.replayInfo[0],
				achievement.replayInfo[0],
			];
			const newAchievement = new CompletedAchievement(
				achievement.id,
				achievement.numberOfCompletions,
				newReplays
			);
			const updated = await this.storage.saveAchievement(newAchievement);
			console.log('added lots of replays to achievement', updated.id, updated);
		}
	}

	private addCollectionCommands() {	
		window['showCardNotification'] = () => {
			const card: Card = new Card('AT_001', 1, 1);
			this.packMonitor.createNewCardToast(card, 'GOLDEN');
		}
	}
}
