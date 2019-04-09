import { Component, Input, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, ElementRef, AfterViewInit, ViewRef, Output, EventEmitter } from '@angular/core';

import { AchievementSet } from '../../models/achievement-set';
import { VisualAchievement } from '../../models/visual-achievement';
import { IOption } from 'ng-select';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { ChangeAchievementsShortDisplayEvent } from '../../services/mainwindow/store/events/achievements/change-achievements-short-display-event';
import { SocialShareUserInfo } from '../../models/mainwindow/social-share-user-info';

declare var overwolf;

@Component({
	selector: 'achievements-list',
	styleUrls: [
		`../../../css/component/achievements/achievements-list.component.scss`,
		`../../../css/global/scrollbar-achievements.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="achievements-container" [ngClass]="{'shrink-header': shortDisplay}">
			<div class="set-title">{{_achievementSet ?_achievementSet.displayName : ''}}</div>
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
						<i class="i-30 selected-icon" *ngIf="option.value == activeFilter">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#selected_dropdown"/>
							</svg>
						</i>
					</ng-template>
				</ng-select>
				<achievement-progress-bar [achievements]="_achievementSet ? _achievementSet.achievements : null">
				</achievement-progress-bar>
			</div>
			<div class="collapse-menu" [ngClass]="{'shrink-header': shortDisplay}" (click)="toggleMenu()">
				<i class="i-13X7" *ngIf="showCollapse">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#collapse_caret"/>
					</svg>
				</i>
			</div>
			<ul class="achievements-list" 
					*ngIf="activeAchievements && activeAchievements.length > 0" 
					(scroll)="onScroll($event)">
				<li *ngFor="let achievement of activeAchievements; trackBy: trackByAchievementId ">
					<achievement-view 
							[attr.data-achievement-id]="achievement.id.toLowerCase()"
							[socialShareUserInfo]="socialShareUserInfo"
							[showReplays]="_selectedAchievementId === achievement.id"
							[achievement]="achievement">
					</achievement-view>
				</li>
			</ul>
			<section class="empty-state" *ngIf="!activeAchievements || activeAchievements.length === 0">
				<div class="state-container">
					<i class="i-236X165 pale-pink-theme" [innerHTML]="emptyStateSvgTemplate"></i>
					<span class="title">{{emptyStateTitle}}</span>
					<span class="subtitle">{{emptyStateText}}</span>
				</div>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsListComponent implements AfterViewInit {

	readonly SCROLL_SHRINK_START_PX = 5 * 100;

	@Input() shortDisplay: boolean;
	@Input() socialShareUserInfo: SocialShareUserInfo;
	_achievementSet: AchievementSet;
	_selectedAchievementId: string;
	achievements: ReadonlyArray<VisualAchievement>;

	activeAchievements: VisualAchievement[];
	filterOptions: Array<IOption>;
	activeFilter: string;
	emptyStateSvgTemplate: SafeHtml;
	emptyStateIcon: string;
	emptyStateTitle: string;
	emptyStateText: string;
	showCollapse: boolean;

	private lastScrollPosition: number = 0;
	private lastScrollPositionBeforeScrollDown: number = 0;
	private lastScrollPositionBeforeScrollUp: number = 0;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private cdr: ChangeDetectorRef, private el: ElementRef, private domSanitizer: DomSanitizer) {

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
		setTimeout(() => {
			if (!(<ViewRef>this.cdr).destroyed) {
				this.cdr.detectChanges();
			}
		});
		this.stateUpdater = overwolf.windows.getMainWindow().mainWindowStoreUpdater;
	}

	@Input('achievementSet') set achievementSet(achievementSet: AchievementSet) {
		this._achievementSet = achievementSet;
		if (achievementSet) {
			this.filterOptions = this._achievementSet.filterOptions
				.map((option) => ({ label: option.label, value: option.value }));
			this.activeFilter = this.filterOptions[0].value;
			this.updateShownAchievements();
		}
	}

	@Input('achievementsList') set achievementsList(achievementsList: VisualAchievement[]) {
		this.achievements = achievementsList || [];
		this.updateShownAchievements();
	}

	@Input('selectedAchievementId') set selectedAchievementId(selectedAchievementId: string) {
		if (selectedAchievementId && selectedAchievementId !== this._selectedAchievementId) {
			this.stateUpdater.next(new ChangeAchievementsShortDisplayEvent(true));
			const achievementToShow: Element = this.el.nativeElement
					.querySelector(`achievement-view[data-achievement-id=${selectedAchievementId.toLowerCase()}]`);
			achievementToShow.scrollIntoView(true);
		}
		this._selectedAchievementId = selectedAchievementId;
	}

	toggleMenu() {
		this.stateUpdater.next(new ChangeAchievementsShortDisplayEvent(!this.shortDisplay));
	}
	
	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		// console.log('handling history click', event);
		const achievementsList = this.el.nativeElement.querySelector('.achievements-list');
		if (!achievementsList) {
			return;
		}
		let rect = achievementsList.getBoundingClientRect();
		// console.log('element rect', rect);
		let scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}

	onScroll(event: Event) {
		// console.log('scrolling event', event);
		const elem = this.el.nativeElement.querySelector('.achievements-list');
		// console.log('showing header?', elem.scrollTop, this.lastScrollPosition, this.headerClass);
		if (elem.scrollTop > this.lastScrollPosition) {
			this.onScrollDown(elem.scrollTop);
		}
		else if (elem.scrollTop <= this.lastScrollPosition) {
			this.onScrollUp(elem.scrollTop);
		}
		this.lastScrollPosition = elem.scrollTop;
	}

	selectFilter(option: IOption) {
		this.activeFilter = option.value;
		this.updateShownAchievements();
	}

	trackByAchievementId(achievement: VisualAchievement, index: number) {
		return achievement.id;
	}

	refresh() {
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private onScrollDown(scrollPosition: number) {
		this.lastScrollPositionBeforeScrollUp = scrollPosition;
		if (scrollPosition - this.lastScrollPositionBeforeScrollDown >= this.SCROLL_SHRINK_START_PX && !this.shortDisplay) {
			this.stateUpdater.next(new ChangeAchievementsShortDisplayEvent(true));
		}
	}

	private onScrollUp(scrollPosition: number) {
		this.lastScrollPositionBeforeScrollDown = scrollPosition;
		if (this.lastScrollPositionBeforeScrollUp - scrollPosition >= this.SCROLL_SHRINK_START_PX && this.shortDisplay) {
			this.stateUpdater.next(new ChangeAchievementsShortDisplayEvent(false));
		}
	}

	private updateShownAchievements() {
		if (!this.achievements || !this._achievementSet) {
			return;
		}
		const filterOption = this._achievementSet.filterOptions
				.filter((option) => option.value === this.activeFilter)
				[0];
		const filterFunction: (VisualAchievement) => boolean = filterOption.filterFunction;
		this.emptyStateIcon = filterOption.emptyStateIcon;
		this.emptyStateTitle = filterOption.emptyStateTitle;
		this.emptyStateText = filterOption.emptyStateText;
		this.emptyStateSvgTemplate = this.domSanitizer.bypassSecurityTrustHtml(`
			<svg class="svg-icon-fill">
				<use xlink:href="/Files/assets/svg/sprite.svg#${this.emptyStateIcon}"/>
			</svg>
		`);
		this.activeAchievements = this.achievements.filter(filterFunction);
		this.showCollapse = this.activeAchievements.length > 0;
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
