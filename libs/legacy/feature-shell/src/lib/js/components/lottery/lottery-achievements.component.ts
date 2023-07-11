import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { sortByProperties } from '@firestone/shared/framework/common';
import { Observable, tap } from 'rxjs';
import { Preferences } from '../../models/preferences';
import { AchievementsProgressTracking } from '../../services/achievement/achievements-live-progress-tracking.service';
import { AchievementsTrackRandomAchievementsEvent } from '../../services/mainwindow/store/processors/achievements/achievements-track-random-achievements';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';

@Component({
	selector: 'lottery-achievements',
	styleUrls: [
		'../../../css/component/lottery/lottery-section.scss',
		'../../../css/component/lottery/lottery-achievements.component.scss',
	],
	template: `
		<div class="main-content">
			<div class="achievements" *ngIf="achievements$ | async as achievements; else emptyState">
				<lottery-achievement
					*ngFor="let achievement of achievements; trackBy: trackByFn"
					class="achievement"
					[achievement]="achievement"
				></lottery-achievement>
				<div class="button-container">
					<button
						class="button"
						[owTranslate]="'app.lottery.achievements-reset-button'"
						[helpTooltip]="'app.lottery.achievements-reset-button-tooltip' | owTranslate"
						[helpTooltipClasses]="'general-theme'"
						(click)="resetAchievements()"
					></button>
				</div>
			</div>
			<ng-template #emptyState>
				<div class="empty-state" [owTranslate]="'app.lottery.achievements-empty-state'"></div>
				<div class="button-container">
					<button
						class="button"
						[owTranslate]="'app.lottery.achievements-pick-for-me-button'"
						[helpTooltip]="'app.lottery.achievements-pick-for-me-button-tooltip' | owTranslate"
						[helpTooltipClasses]="'general-theme'"
						(click)="pickRandomAchievements()"
					></button>
				</div>
			</ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotteryAchievementsWidgetComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	achievements$: Observable<readonly AchievementsProgressTracking[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.achievements$ = this.store.achievementsProgressTracking$().pipe(
			this.mapData((tracking) =>
				!tracking?.length
					? null
					: [...tracking].sort(
							sortByProperties((a: AchievementsProgressTracking) => [
								-a.progressThisGame,
								a.quota - a.progressTotal,
								-a.progressTotal,
								a.name,
							]),
					  ),
			),
			tap((info) => console.debug('[lottery-achievements] info', info)),
		);
	}

	trackByFn(index, item: AchievementsProgressTracking) {
		return item.id;
	}

	async resetAchievements() {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = { ...prefs, pinnedAchievementIds: [] };
		await this.prefs.savePreferences(newPrefs);
	}

	pickRandomAchievements() {
		console.debug('picking achievements');
		this.store.send(new AchievementsTrackRandomAchievementsEvent());
	}
}
