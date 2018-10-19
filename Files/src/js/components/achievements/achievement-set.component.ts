import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { AchievementSet } from '../../models/achievement-set';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
	selector: 'achievement-set-view',
	styleUrls: [
		`../../../css/component/achievements/achievement-set.component.scss`,
		`../../../css/global/components-global.scss`,
	],
	template: `
		<div *ngIf="_achievementSet" class="achievement-set">
			<div class="frame complete-simple" *ngIf="complete">
				<i class="i-25 pale-gold-theme corner bottom-left">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner"/>
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner top-left">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner"/>
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner top-right">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner"/>
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner bottom-right">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner"/>
					</svg>
				</i>
			</div>
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
	svgTemplate: SafeHtml;
	complete: boolean = false;

	constructor(private domSanitizer: DomSanitizer) {

	}

	@Input('achievementSet') set achievementSet(achievementSet: AchievementSet) {
		this._achievementSet = achievementSet;
		this.svgTemplate = this.domSanitizer.bypassSecurityTrustHtml(`
			<svg>
				<use xlink:href="/Files/assets/svg/sprite.svg#${this._achievementSet.logoName}"/>
			</svg>`
		);
		const flatCompletions = achievementSet.achievements
				.map((achievement) => achievement.numberOfCompletions)
				.reduce((a, b) => a.concat(b));
		const total = flatCompletions.length;
		const achieved = flatCompletions.filter((a) => a > 0).length;
		this.complete = total === achieved;
	}
}
