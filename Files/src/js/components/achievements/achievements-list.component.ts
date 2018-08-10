import { Component, Input, ViewEncapsulation, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { Achievement } from '../../models/achievement';
import { AchievementSet } from '../../models/achievement-set';

declare var overwolf: any;

@Component({
	selector: 'achievements-list',
	styleUrls: [`../../../css/component/achievements/achievements-list.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="achievements-container">
			<ul class="achievements-list" *ngIf="activeAchievements">
				<li *ngFor="let achievement of activeAchievements">
					<achievement-view [achievement]="achievement">/</achievement-view>
				</li>
			</ul>
			<ul class="pagination" *ngIf="numberOfPages > 1">
				<li class="arrow previous" (click)="previousPage()" [ngClass]="currentPage == 0 ? 'disabled' : ''">
					<i class="i-30">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#arrow"/>
						</svg>
					</i>
				</li>
				<li *ngFor="let page of pages" [ngClass]="currentPage == page ? 'active' : ''" (click)="goToPage(page)">{{page + 1}}</li>
				<li class="arrow next" (click)="nextPage()" [ngClass]="currentPage >= numberOfPages - 1 ? 'disabled' : ''">
					<i class="i-30">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#arrow"/>
						</svg>
					</i>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsListComponent {

	readonly MAX_ACHIEVEMENTS_DISPLAYED_PER_PAGE = 18;

	achievements: Achievement[];
	activeAchievements: Achievement[];
	_achievementSet: AchievementSet;
	numberOfPages: number;
	currentPage = 0;
	pages: number[] = [];

	private achievementsIndexRangeStart = 0;

	constructor(private cdr: ChangeDetectorRef) {

	}

	@Input('achievementSet') set achievementSet(achievementSet: AchievementSet) {
		this.currentPage = 0;
		this._achievementSet = achievementSet;
	}

	@Input('achievementsList') set achievementsList(achievementsList: Achievement[]) {
		this.currentPage = 0;
		this.achievements = achievementsList || [];
		this.updateShownAchievements();
	}

	previousPage() {
		this.currentPage = Math.max(0, this.currentPage - 1);
		this.updateShownAchievements();
	}

	nextPage() {
		this.currentPage = Math.min(this.numberOfPages - 1, this.currentPage + 1);
		this.updateShownAchievements();
	}

	goToPage(page: number) {
		this.currentPage = page;
		this.updateShownAchievements();
	}

	trackById(achievement: Achievement, index: number) {
		return achievement.id;
	}

	private updateShownAchievements() {
		// console.log('updating card list', this._cardList);
		this.achievementsIndexRangeStart = this.currentPage * this.MAX_ACHIEVEMENTS_DISPLAYED_PER_PAGE;
		this.pages = [];
		this.numberOfPages = Math.ceil(this.achievements.length / this.MAX_ACHIEVEMENTS_DISPLAYED_PER_PAGE);
		for (let i = 0; i < this.numberOfPages; i++) {
			this.pages.push(i);
		}
		this.activeAchievements = this.achievements.slice(
			this.achievementsIndexRangeStart,
			this.achievementsIndexRangeStart + this.MAX_ACHIEVEMENTS_DISPLAYED_PER_PAGE);
		this.cdr.detectChanges();
	}
}
