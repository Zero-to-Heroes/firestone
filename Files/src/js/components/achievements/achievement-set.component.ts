import { Component, NgZone, Input, SimpleChanges } from '@angular/core';

import { AchievementSet } from '../../models/achievement-set';

declare var overwolf: any;

@Component({
	selector: 'achievement-set-view',
	styleUrls: [`../../../css/component/achievements/achievement-set.component.scss`],
	template: `
		<div *ngIf="_achievementSet" class="achievement-set">
			<div class="logo-container">
				<span class="text set-name">{{displayName()}}</span>
			</div>
			<span class="achieved">{{achieved()}}/{{_achievementSet.achievements.length}}</span>
		</div>
	`,
})
export class AchievementSetComponent {

	_achievementSet: AchievementSet;

	@Input('achievementSet') set achievementSet(achievementSet: AchievementSet) {
		this._achievementSet = achievementSet;
	}

	achieved() {
		return this._achievementSet.achievements
				.filter(achievement => achievement.numberOfCompletions > 0)
				.length;
	}

	displayName() {
		switch (this._achievementSet.id) {
			case 'dungeon_run_boss_encounter':
				return 'Dungeon Run - Boss Encounters';
			case 'dungeon_run_boss_victory':
				return 'Dungeon Run - Boss Victories';
			case 'monster_hunt_boss_encounter':
				return 'Monster Hunt - Boss Encounters';
			case 'monster_hunt_boss_victory':
				return 'Monster Hunt - Boss Victories';
			default:
				return this._achievementSet.id;
		}
	}
}
