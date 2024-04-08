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
import { sortByProperties } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { findAchievements } from '../../models/mainwindow/achievements-state';
import { VisualAchievement } from '../../models/visual-achievement';
import { AchievementsStateManagerService } from '../../services/achievement/achievements-state-manager.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

@Component({
	selector: 'achievements-list',
	styleUrls: [`../../../css/component/achievements/achievements-list.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div
			class="achievements-container"
			*ngIf="{
				totalAchievements: totalAchievements$ | async,
				activeAchievements: activeAchievements$ | async,
				pinnedAchievements: pinnedAchievements$ | async
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
export class AchievementsListComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	activeAchievements$: Observable<VisualAchievement[]>;
	totalAchievements$: Observable<number>;
	achieved$: Observable<number>;
	emptyStateSvgTemplate$: Observable<SafeHtml>;
	emptyStateTitle$: Observable<string>;
	emptyStateText$: Observable<string>;
	pinnedAchievements$: Observable<readonly number[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly domSanitizer: DomSanitizer,
		private readonly achievements: AchievementsStateManagerService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.achievements);

		const achievements$ = combineLatest([
			this.achievements.groupedAchievements$$,
			this.store.listen$(([main, nav, prefs]) => nav.navigationAchievements.displayedAchievementsList),
		]).pipe(
			this.mapData(([categories, [displayedAchievementsList]]) =>
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
		const filterOption$ = combineLatest(
			this.store.listenPrefs$((prefs) => prefs.achievementsCompletedActiveFilter),
			this.store.listen$(([main, nav]) => main.achievements.filters),
		).pipe(this.mapData(([[pref], [filters]]) => filters.find((option) => option.value === pref)));
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
		this.activeAchievements$ = combineLatest(achievements$, filterOption$).pipe(
			this.mapData(([achievements, option]) =>
				achievements
					.filter(option.filterFunction)
					.sort(sortByProperties((a) => [a.isFullyCompleted(), a.name])),
			),
		);
		this.store
			.listen$(([main, nav, prefs]) => nav.navigationAchievements.selectedAchievementId)
			.pipe(this.mapData(([selectedAchievementId]) => selectedAchievementId))
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
		this.pinnedAchievements$ = this.store
			.listen$(([main, nav, prefs]) => prefs.pinnedAchievementIds)
			.pipe(this.mapData(([pinnedAchievementIds]) => pinnedAchievementIds));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByAchievementId(index: number, achievement: VisualAchievement) {
		return achievement.id;
	}
}
