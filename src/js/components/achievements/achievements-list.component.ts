import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IOption } from 'ng-select';
import { AchievementSet } from '../../models/achievement-set';
import { SocialShareUserInfo } from '../../models/mainwindow/social-share-user-info';
import { GlobalStats } from '../../models/mainwindow/stats/global/global-stats';
import { VisualAchievement } from '../../models/visual-achievement';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'achievements-list',
	styleUrls: [
		`../../../css/component/achievements/achievements-list.component.scss`,
		`../../../css/global/scrollbar-achievements.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="achievements-container">
			<div class="show-filter">
				<ng-select
					class="filter"
					[options]="filterOptions"
					[ngModel]="activeFilter"
					placeholder="All achievements"
					(selected)="selectFilter($event)"
					(opened)="refresh()"
					(closed)="refresh()"
					[noFilter]="1"
				>
					<ng-template #optionTemplate let-option="option">
						<span>{{ option?.label }}</span>
						<i class="i-30 selected-icon" *ngIf="option.value === activeFilter">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#selected_dropdown" />
							</svg>
						</i>
					</ng-template>
				</ng-select>
				<achievements-filter></achievements-filter>
				<achievement-progress-bar [achievements]="_achievementSet ? _achievementSet.achievements : null">
				</achievement-progress-bar>
			</div>
			<ul
				class="achievements-list"
				*ngIf="activeAchievements && activeAchievements.length > 0"
				(scroll)="onScroll($event)"
			>
				<li *ngFor="let achievement of activeAchievements; trackBy: trackByAchievementId">
					<achievement-view
						[attr.data-achievement-id]="achievement.id.toLowerCase()"
						[socialShareUserInfo]="socialShareUserInfo"
						[showReplays]="_selectedAchievementId === achievement.id"
						[achievement]="achievement"
						[globalStats]="globalStats"
					>
					</achievement-view>
				</li>
			</ul>
			<section class="empty-state" *ngIf="!activeAchievements || activeAchievements.length === 0">
				<div class="state-container">
					<i class="i-236X165 pale-pink-theme" [innerHTML]="emptyStateSvgTemplate"></i>
					<span class="title">{{ emptyStateTitle }}</span>
					<span class="subtitle">{{ emptyStateText }}</span>
				</div>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsListComponent implements AfterViewInit {
	@Input() socialShareUserInfo: SocialShareUserInfo;
	@Input() globalStats: GlobalStats;
	_achievementSet: AchievementSet;
	_selectedAchievementId: string;
	achievements: readonly VisualAchievement[];

	activeAchievements: VisualAchievement[];
	filterOptions: IOption[];
	activeFilter: string;
	emptyStateSvgTemplate: SafeHtml;
	emptyStateIcon: string;
	emptyStateTitle: string;
	emptyStateText: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private cdr: ChangeDetectorRef,
		private el: ElementRef,
		private ow: OverwolfService,
		private domSanitizer: DomSanitizer,
	) {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	ngAfterViewInit() {
		const singleEls: HTMLElement[] = this.el.nativeElement.querySelectorAll('.single');
		singleEls.forEach(singleEl => {
			const caretEl = singleEl.appendChild(document.createElement('i'));
			caretEl.innerHTML = `<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#arrow"/>
				</svg>`;
			caretEl.classList.add('i-30');
			caretEl.classList.add('caret');
		});
		setTimeout(() => {
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	@Input('achievementSet') set achievementSet(achievementSet: AchievementSet) {
		this._achievementSet = achievementSet;
		if (achievementSet) {
			this.filterOptions = this._achievementSet.filterOptions.map(option => ({
				label: option.label,
				value: option.value,
			}));
			this.activeFilter = this.filterOptions[0].value;
			console.log('set active filter', this.activeFilter);
			this.updateShownAchievements();
		}
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input('achievementsList') set achievementsList(achievementsList: VisualAchievement[]) {
		this.achievements = achievementsList || [];
		this.updateShownAchievements();
	}

	@Input('selectedAchievementId') set selectedAchievementId(selectedAchievementId: string) {
		if (selectedAchievementId && selectedAchievementId !== this._selectedAchievementId) {
			console.log('setting selectedAchievementId', selectedAchievementId, this._selectedAchievementId);
			const achievementToShow: Element = this.el.nativeElement.querySelector(
				`achievement-view[data-achievement-id=${selectedAchievementId.toLowerCase()}]`,
			);
			console.log('achievementToShow?', achievementToShow);
			if (achievementToShow) {
				setTimeout(() => achievementToShow.scrollIntoView(true));
			}
		}
		this._selectedAchievementId = selectedAchievementId;
	}

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		// console.log('handling history click', event);
		const achievementsList = this.el.nativeElement.querySelector('.achievements-list');
		if (!achievementsList) {
			return;
		}
		const rect = achievementsList.getBoundingClientRect();
		// console.log('element rect', rect);
		const scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}

	selectFilter(option: IOption) {
		this.activeFilter = option.value;
		console.log('selected filter', this.activeFilter);
		this.updateShownAchievements();
	}

	trackByAchievementId(achievement: VisualAchievement, index: number) {
		return achievement.id;
	}

	refresh() {
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateShownAchievements() {
		if (!this.achievements || !this._achievementSet) {
			return;
		}
		const filterOption = this._achievementSet.filterOptions.filter(option => option.value === this.activeFilter)[0];
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
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
