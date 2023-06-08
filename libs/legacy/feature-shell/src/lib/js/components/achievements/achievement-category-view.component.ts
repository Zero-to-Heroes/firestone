import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'achievement-category-view',
	styleUrls: [`../../../css/component/achievements/achievement-category-view.component.scss`],
	template: `
		<div class="achievement-set" [ngClass]="{ empty: empty }">
			<div class="frame complete-simple" *ngIf="complete">
				<i class="i-25 pale-gold-theme corner bottom-left">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner top-left">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner top-right">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner bottom-right">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
			</div>
			<span class="text set-name" [helpTooltip]="displayName">{{ displayName }}</span>
			<i class="logo" [inlineSVG]="categoryIcon"> </i>
			<progress-bar [current]="achieved" [total]="totalAchievements"></progress-bar>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementCategoryViewComponent {
	@Input() empty: boolean;
	@Input() complete: boolean;
	@Input() displayName: string;
	@Input() categoryIcon: string;
	@Input() achieved: number;
	@Input() totalAchievements: number;
}
