import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { IOption } from 'ng-select';
import { FilterOption } from '../../models/filter-option';
import { SocialShareUserInfo } from '../../models/mainwindow/social-share-user-info';
import { VisualAchievement } from '../../models/visual-achievement';
import { ChangeAchievementsActiveFilterEvent } from '../../services/mainwindow/store/events/achievements/change-achievements-active-filter-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'achievements-list',
	styleUrls: [
		`../../../css/component/achievements/achievements-list.component.scss`,
		`../../../css/global/scrollbar.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="achievements-container" scrollable>
			<div class="show-filter" *ngIf="totalAchievements > 0">
				<ng-select
					class="filter"
					[options]="filterOptions"
					[ngModel]="_activeFilter"
					placeholder="All achievements"
					(selected)="selectFilter($event)"
					(opened)="refresh()"
					(closed)="refresh()"
					[noFilter]="1"
				>
					<ng-template #optionTemplate let-option="option">
						<span>{{ option?.label }}</span>
						<i class="i-30 selected-icon" *ngIf="option.value === _activeFilter">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#selected_dropdown" />
							</svg>
						</i>
					</ng-template>
				</ng-select>
				<achievement-progress-bar [achieved]="achieved" [total]="totalAchievements"> </achievement-progress-bar>
			</div>
			<ul class="achievements-list" *ngIf="activeAchievements && activeAchievements.length > 0">
				<li *ngFor="let achievement of activeAchievements; trackBy: trackByAchievementId">
					<achievement-view
						[attr.data-achievement-id]="achievement.id.toLowerCase()"
						[socialShareUserInfo]="socialShareUserInfo"
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
	_activeFilter: string;
	// _category: VisualAchievementCategory;
	_selectedAchievementId: string;
	totalAchievements: number;
	achieved: number;

	activeAchievements: VisualAchievement[];
	filters = this.buildFilterOptions();
	filterOptions: IOption[] = this.filters.map((option) => ({
		label: option.label,
		value: option.value,
	}));
	emptyStateSvgTemplate: SafeHtml;
	emptyStateIcon: string;
	emptyStateTitle: string;
	emptyStateText: string;

	private achievements: readonly VisualAchievement[];
	private filterFromPrefs: string;

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
		singleEls.forEach((singleEl) => {
			const caretEl = singleEl.appendChild(document.createElement('i'));
			caretEl.innerHTML = `<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#arrow"/>
				</svg>`;
			caretEl.classList.add('i-30');
			caretEl.classList.add('caret');
		});
		setTimeout(() => {
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	// @Input() set category(value: VisualAchievementCategory) {
	// 	// this._category = value;
	// 	if (value) {
	// 		// this.filterOptions = this._category.filterOptions.map(option => ({
	// 		// 	label: option.label,
	// 		// 	value: option.value,
	// 		// }));

	//
	// 		this.updateShownAchievements();
	// 	}
	// 	if (!(this.cdr as ViewRef)?.destroyed) {
	// 		this.cdr.detectChanges();
	// 	}
	// }

	@Input() set activeFilter(value: string) {
		this.filterFromPrefs = value;
		this.updateShownAchievements();
	}

	@Input() set achievementsList(achievementsList: VisualAchievement[]) {
		//console.debug('[achievements-list] setting achievementsList ', achievementsList);
		this.achievements = achievementsList || [];
		this.updateShownAchievements();
	}

	@Input() set selectedAchievementId(selectedAchievementId: string) {
		if (selectedAchievementId && selectedAchievementId !== this._selectedAchievementId) {
			// 	'[achievements-list] setting selectedAchievementId',
			// 	selectedAchievementId,
			// 	this._selectedAchievementId,
			// );
			const achievementToShow: Element = this.el.nativeElement.querySelector(
				`achievement-view[data-achievement-id=${selectedAchievementId.toLowerCase()}]`,
			);

			if (achievementToShow) {
				setTimeout(() => {
					achievementToShow.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
					window.scrollTo({ top: 0, behavior: 'auto' });
				});
			}
		}
		this._selectedAchievementId = selectedAchievementId;
	}

	selectFilter(option: IOption) {
		this.stateUpdater.next(new ChangeAchievementsActiveFilterEvent(option.value));
	}

	trackByAchievementId(achievement: VisualAchievement, index: number) {
		return achievement.id;
	}

	refresh() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateShownAchievements() {
		if (!this.achievements) {
			return;
		}

		const flatCompletions = this.achievements
			.map((achievement) => achievement.completionSteps)
			.reduce((a, b) => a.concat(b), []);
		this.totalAchievements = flatCompletions.length;
		this.achieved = flatCompletions.filter((a) => a.numberOfCompletions > 0).length;

		this.updateActiveFilter();
		const filterOption = this.filters.filter((option) => option.value === this._activeFilter)[0];
		const filterFunction: (VisualAchievement) => boolean = filterOption?.filterFunction || ((achievement) => true);
		this.emptyStateIcon = filterOption?.emptyStateIcon;
		this.emptyStateTitle = filterOption?.emptyStateTitle;
		this.emptyStateText = filterOption?.emptyStateText;
		this.emptyStateSvgTemplate = this.domSanitizer.bypassSecurityTrustHtml(`
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#${this.emptyStateIcon}"/>
				</svg>
			`);
		this.activeAchievements = this.achievements.filter(filterFunction);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateActiveFilter() {
		this._activeFilter =
			this.filterFromPrefs ||
			(this.filterOptions && this.filterOptions.length > 0 ? this.filterOptions[0].value : null);
	}

	protected buildFilterOptions(): readonly FilterOption[] {
		return [
			{
				value: 'ALL_ACHIEVEMENTS',
				label: 'All achievements',
				filterFunction: (a) => true,
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: 'Holy Moly, you are epic!',
				emptyStateText: '100% of achievements in this category complete.',
			},
			{
				value: 'ONLY_MISSING',
				label: 'Incomplete achievements',
				filterFunction: (a: VisualAchievement) => {
					return a.completionSteps.some((step) => step.numberOfCompletions === 0);
				},
				emptyStateIcon: 'empty_state_Only_cards_I_don’t_have_illustration',
				emptyStateTitle: 'Tons of achievements are awaiting you!',
				emptyStateText: 'Find them listed here once completed.',
			},
			{
				value: 'ONLY_COMPLETED',
				label: 'Completed achievements',
				filterFunction: (a: VisualAchievement) => {
					return a.completionSteps.every((step) => step.numberOfCompletions > 0);
				},
				emptyStateIcon: 'empty_state_Only_cards_I_have_illustration',
				emptyStateTitle: 'Tons of achievements are awaiting you!',
				emptyStateText: 'Find them listed here once completed.',
			},
		];
	}
}
