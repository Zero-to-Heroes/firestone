import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AchievementSet } from '../../models/achievement-set';

@Component({
	selector: 'achievement-set-view',
	styleUrls: [
		`../../../css/component/achievements/achievement-set.component.scss`,
		`../../../css/global/components-global.scss`,
	],
	template: `
		<div class="achievement-set" [ngClass]="{ 'empty': empty }">
			<div class="frame complete-simple" *ngIf="complete">
				<i class="i-25 pale-gold-theme corner bottom-left">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner top-left">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner top-right">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner bottom-right">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
			</div>
			<span class="text set-name">{{ displayName }}</span>
			<i class="logo" [innerHTML]="svgTemplate"> </i>
			<achievement-progress-bar [achievements]="_achievementSet.achievements"></achievement-progress-bar>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementSetComponent {
	_achievementSet: AchievementSet;
	displayName: string;
	svgTemplate: SafeHtml;
	complete = false;
	empty = false;

	constructor(private domSanitizer: DomSanitizer) {}

	@Input('achievementSet') set achievementSet(achievementSet: AchievementSet) {
		this._achievementSet = achievementSet;
		if (achievementSet) {
			this.svgTemplate = this.domSanitizer.bypassSecurityTrustHtml(`
				<svg>
					<use xlink:href="/Files/assets/svg/sprite.svg#${this._achievementSet.logoName}"/>
				</svg>`);
			this.displayName = achievementSet.displayName;
			const flatCompletions = achievementSet.achievements
				.map(achievement => achievement.completionSteps)
				.reduce((a, b) => a.concat(b));
			const total = flatCompletions.length;
			const achieved = flatCompletions.filter(a => a.numberOfCompletions > 0).length;
			this.complete = total === achieved;
			this.empty = achieved === 0;
		}
	}
}
