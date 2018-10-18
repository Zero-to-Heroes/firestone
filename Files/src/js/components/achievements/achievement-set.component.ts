import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { AchievementSet } from '../../models/achievement-set';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
	selector: 'achievement-set-view',
	styleUrls: [`../../../css/component/achievements/achievement-set.component.scss`],
	template: `
		<div *ngIf="_achievementSet" class="achievement-set">
			<span class="text set-name">{{_achievementSet.displayName}}</span>
			<i class="logo" [innerHTML]="svgTemplate">
				
			</i>
			<achievement-progress-bar [achievementSet]="_achievementSet"></achievement-progress-bar>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementSetComponent {

	_achievementSet: AchievementSet;
	svgTemplate;

	constructor(private domSanitizer: DomSanitizer) {

	}

	@Input('achievementSet') set achievementSet(achievementSet: AchievementSet) {
		this._achievementSet = achievementSet;
		this.svgTemplate = this.domSanitizer.bypassSecurityTrustHtml(`
			<svg>
				<use xlink:href="/Files/assets/svg/sprite.svg#${this._achievementSet.logoName}"/>
			</svg>`
		);
	}
}
