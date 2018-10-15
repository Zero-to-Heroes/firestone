import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { AchievementSet } from '../../models/achievement-set';

@Component({
	selector: 'achievement-set-view',
	styleUrls: [`../../../css/component/achievements/achievement-set.component.scss`],
	template: `
		<div *ngIf="_achievementSet" class="achievement-set">
			<span class="text set-name">{{_achievementSet.displayName}}</span>
			<div class="logo"></div>
			<achievement-progress-bar [achievementSet]="_achievementSet"></achievement-progress-bar>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementSetComponent {

	_achievementSet: AchievementSet;

	@Input('achievementSet') set achievementSet(achievementSet: AchievementSet) {
		this._achievementSet = achievementSet;
	}
}
