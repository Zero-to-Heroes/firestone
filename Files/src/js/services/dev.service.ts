import { Injectable } from '@angular/core';
import { AchievementsMonitor } from './achievement/achievements-monitor.service';
import { Achievement } from '../models/achievement';

declare var overwolf: any;

@Injectable()
export class DevService {

	constructor(private achievementMonitor: AchievementsMonitor) {
		this.addTestCommands();
	}

	private addTestCommands() {
		window['showNotification'] = () => {
			const achievement = new Achievement(
				'dungeon_run_boss_encounter_LOOTA_BOSS_44h',
				'Fake Wee Whelp',
				'dungeon_run_boss_encounter',
				'LOOTA_BOSS_44h',
				'common',
				1
			)
			this.achievementMonitor.sendNotification(achievement);
		}
	}
}
