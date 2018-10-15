import { Component, Input, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, ElementRef, AfterViewInit } from '@angular/core';

import { AchievementSet } from '../../models/achievement-set';
import { VisualAchievement } from '../../models/visual-achievement';
import { FilterOption } from '../../models/filter-option';
import { IOption } from 'ng-select';

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
			<div class="show-filter">
				<ng-select
					class="filter"
					[options]="filterOptions"
					[(ngModel)]="activeFilter"
					(selected)="selectFilter($event)"
					(opened)="refresh()"
					(closed)="refresh()"
					[noFilter]="1">
					<ng-template #optionTemplate let-option="option">
						<span>{{option?.label}}</span>
						<i class="i-30" *ngIf="option.value == activeFilter">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#selected_dropdown"/>
							</svg>
						</i>
					</ng-template>
				</ng-select>
			</div>
			<ul class="achievements-list" *ngIf="activeAchievements">
				<li *ngFor="let achievement of activeAchievements">
					<achievement-view [achievement]="achievement">/</achievement-view>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsListComponent implements AfterViewInit {

	achievements: VisualAchievement[];
	activeAchievements: VisualAchievement[];
	_achievementSet: AchievementSet;
	filterOptions: Array<IOption>;
	activeFilter: string;

	constructor(private cdr: ChangeDetectorRef, private el: ElementRef) {

	}

	ngAfterViewInit() {
		let singleEls: HTMLElement[] = this.el.nativeElement.querySelectorAll('.single');
		singleEls.forEach((singleEl) => {
			let caretEl = singleEl.appendChild(document.createElement('i'));
			caretEl.innerHTML =
				`<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#arrow"/>
				</svg>`;
			caretEl.classList.add('i-30');
			caretEl.classList.add('caret');
		});
		setTimeout(() => this.cdr.detectChanges());
	}

	@Input('achievementSet') set achievementSet(achievementSet: AchievementSet) {
		this._achievementSet = achievementSet;
		this.filterOptions = this._achievementSet.filterOptions
			.map((option) => ({ label: option.label, value: option.value }));
		this.activeFilter = this.filterOptions[0].value;
		this.updateShownAchievements();
	}

	@Input('achievementsList') set achievementsList(achievementsList: VisualAchievement[]) {
		this.achievements = achievementsList || [];
		this.updateShownAchievements();
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

	selectFilter(option: IOption) {
		this.activeFilter = option.value;
		this.updateShownAchievements();
	}

	trackById(achievement: VisualAchievement, index: number) {
		return achievement.id;
	}

	refresh() {
		this.cdr.detectChanges();
	}

	private updateShownAchievements() {
		if (!this.achievements) {
			return;
		}
		const filterFunction: (VisualAchievement) => boolean = this._achievementSet.filterOptions
			.filter((option) => option.value === this.activeFilter)
			[0]
			.filterFunction;
		this.activeAchievements = this.achievements.filter(filterFunction);
		this.cdr.detectChanges();
	}
}
