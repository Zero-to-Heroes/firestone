import { Component, Input, ViewEncapsulation, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, ElementRef } from '@angular/core';

import { Achievement } from '../../models/achievement';
import { AchievementSet } from '../../models/achievement-set';

declare var overwolf: any;

@Component({
	selector: 'achievements-list',
	styleUrls: [
		`../../../css/component/achievements/achievements-list.component.scss`,
		`../../../css/global/scrollbar-achievements.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="achievements-container">
			<div class="set-title">{{_achievementSet.displayName}}</div>
			<ul class="achievements-list" *ngIf="activeAchievements">
				<li *ngFor="let achievement of activeAchievements">
					<achievement-view [achievement]="achievement">/</achievement-view>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsListComponent {

	achievements: Achievement[];
	activeAchievements: Achievement[];
	_achievementSet: AchievementSet;

	constructor(private cdr: ChangeDetectorRef, private el: ElementRef) {

	}

	@Input('achievementSet') set achievementSet(achievementSet: AchievementSet) {
		this._achievementSet = achievementSet;
	}

	@Input('achievementsList') set achievementsList(achievementsList: Achievement[]) {
		this.achievements = achievementsList || [];
		this.updateShownAchievements();
	}

	trackById(achievement: Achievement, index: number) {
		return achievement.id;
	}

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		// console.log('handling history click', event);
		let rect = this.el.nativeElement.querySelector('.achievements-list').getBoundingClientRect();
		// console.log('element rect', rect);
		let scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}

	private updateShownAchievements() {
		this.activeAchievements = this.achievements;
		this.cdr.detectChanges();
	}
}
