import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AchievementsStateManagerService, VisualAchievement } from '@firestone/achievements/common';
import {
	FilterOption,
	MainWindowNavigationService,
	MainWindowStateFacadeService,
	findAchievements,
} from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';

@Component({
	standalone: false,
	selector: 'achievements-list',
	styleUrls: [`../../../css/component/achievements/achievements-list.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div
			class="achievements-container"
			*ngIf="{
				totalAchievements: totalAchievements$ | async,
				activeAchievements: activeAchievements$ | async,
				pinnedAchievements: pinnedAchievements$ | async,
			} as value"
			scrollable
		>
			<div class="show-filter" *ngIf="value.totalAchievements > 0">
				<achievements-completed-filter-dropdown class="filter"></achievements-completed-filter-dropdown>
				<achievement-progress-bar [achieved]="achieved$ | async" [total]="value.totalAchievements">
				</achievement-progress-bar>
			</div>
			<ul class="achievements-list" *ngIf="value.activeAchievements && value.activeAchievements.length > 0">
				<li *ngFor="let achievement of value.activeAchievements; trackBy: trackByAchievementId">
					<achievement-view
						[attr.data-achievement-id]="achievement.id?.toLowerCase()"
						[achievement]="achievement"
						[pinnedAchievements]="value.pinnedAchievements"
					>
					</achievement-view>
				</li>
			</ul>
			<section class="empty-state" *ngIf="!value.activeAchievements || value.activeAchievements.length === 0">
				<div class="state-container">
					<i class="i-236X165 pale-pink-theme" [innerHTML]="emptyStateSvgTemplate$ | async"></i>
					<span class="title">{{ emptyStateTitle$ | async }}</span>
					<span class="subtitle">{{ emptyStateText$ | async }}</span>
				</div>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsListComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	activeAchievements$: Observable<VisualAchievement[]>;
	totalAchievements$: Observable<number>;
	achieved$: Observable<number>;
	emptyStateSvgTemplate$: Observable<SafeHtml>;
	emptyStateTitle$: Observable<string>;
	emptyStateText$: Observable<string>;
	pinnedAchievements$: Observable<readonly number[]>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly domSanitizer: DomSanitizer,
		private readonly achievements: AchievementsStateManagerService,
		private readonly prefs: PreferencesService,
		private readonly mainWindowNavigation: MainWindowNavigationService,
		private readonly mainWindowState: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.achievements, this.prefs, this.mainWindowNavigation, this.mainWindowState);

		const achievements$ = combineLatest([
			this.achievements.groupedAchievements$$,
			this.mainWindowNavigation.navigationState$$.pipe(
				this.mapData((nav) => nav.navigationAchievements.displayedAchievementsList),
			),
		]).pipe(
			this.mapData(([categories, displayedAchievementsList]) =>
				findAchievements(categories, displayedAchievementsList),
			),
		);
		const flatCompletions$ = achievements$.pipe(
			this.mapData((achievements) =>
				achievements?.map((achievement) => achievement.completionSteps).reduce((a, b) => a.concat(b), []),
			),
		);
		this.totalAchievements$ = flatCompletions$.pipe(this.mapData((completions) => completions?.length ?? 0));
		this.achieved$ = flatCompletions$.pipe(
			this.mapData((completions) => completions?.filter((a) => a.numberOfCompletions > 0).length ?? 0),
		);
		const filterOption$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.achievementsCompletedActiveFilter)),
			this.mainWindowState.mainWindowState$$.pipe(this.mapData((state) => state.achievements.filters)),
		]).pipe(this.mapData(([pref, filters]) => filters.find((option) => option.value === pref)));
		this.emptyStateTitle$ = filterOption$.pipe(this.mapData((option) => option.emptyStateTitle));
		this.emptyStateText$ = filterOption$.pipe(this.mapData((option) => option.emptyStateText));
		this.emptyStateSvgTemplate$ = filterOption$.pipe(
			this.mapData((option) =>
				this.domSanitizer.bypassSecurityTrustHtml(`
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#${option.emptyStateIcon}"/>
					</svg>
				`),
			),
		);
		this.activeAchievements$ = combineLatest([achievements$, filterOption$]).pipe(
			this.mapData(([achievements, option]) =>
				achievements
					.filter((achievement) => isValid(achievement, option))
					.sort(sortByProperties((a) => [a.isFullyCompleted(), a.name])),
			),
		);
		this.mainWindowNavigation.navigationState$$
			.pipe(this.mapData((nav) => nav.navigationAchievements.selectedAchievementId))
			.pipe(this.mapData((selectedAchievementId) => selectedAchievementId))
			.subscribe((selectedAchievementId) => {
				const achievementToShow: Element = this.el.nativeElement.querySelector(
					`achievement-view[data-achievement-id=${selectedAchievementId?.toLowerCase()}]`,
				);
				if (achievementToShow) {
					setTimeout(() => {
						achievementToShow.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
						window.scrollTo({ top: 0, behavior: 'auto' });
					});
				}
			});
		this.pinnedAchievements$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.pinnedAchievementIds));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	trackByAchievementId(index: number, achievement: VisualAchievement) {
		return achievement.id;
	}
}

const isValid = (achievement: VisualAchievement, option: FilterOption) => {
	switch (option.value) {
		case 'ALL_ACHIEVEMENTS':
			return true;
		case 'ONLY_MISSING':
			return achievement.completionSteps.some((step) => step.numberOfCompletions === 0);
		case 'ONLY_COMPLETED':
			return achievement.completionSteps.every((step) => step.numberOfCompletions > 0);
		default:
			return false;
	}
};
