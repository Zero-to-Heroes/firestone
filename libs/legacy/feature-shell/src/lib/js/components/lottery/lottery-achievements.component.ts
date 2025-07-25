import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { GameStatusService, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { sortByProperties } from '@firestone/shared/framework/common';
import { Observable, tap } from 'rxjs';
import { AchievementsProgressTracking } from '../../services/achievement/achievements-live-progress-tracking.service';
import { AchievementsTrackRandomAchievementsEvent } from '../../services/mainwindow/store/processors/achievements/achievements-track-random-achievements';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';

@Component({
	standalone: false,
	selector: 'lottery-achievements',
	styleUrls: [
		'../../../css/component/lottery/lottery-section.scss',
		'../../../css/component/lottery/lottery-achievements.component.scss',
	],
	template: `
		<div
			class="main-content"
			*ngIf="{
				inGame: inGame$ | async,
				achievements: achievements$ | async
			} as value"
		>
			<ng-container *ngIf="value.achievements?.length || value.inGame; else notInGame">
				<ng-container *ngIf="value.achievements?.length; else emptyState">
					<div class="achievements">
						<lottery-achievement
							*ngFor="let achievement of value.achievements; trackBy: trackByFn"
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
				</ng-container>
			</ng-container>
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
			<ng-template #notInGame>
				<div class="empty-state" [owTranslate]="'app.lottery.achievements-not-in-game'"></div>
			</ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotteryAchievementsWidgetComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	achievements$: Observable<readonly AchievementsProgressTracking[]>;
	inGame$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly gameStatus: GameStatusService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.gameStatus.isReady();

		this.inGame$ = this.gameStatus.inGame$$.pipe(this.mapData((inGame) => inGame));
		this.achievements$ = this.store.achievementsProgressTracking$().pipe(
			tap((tracking) => console.debug('[lottery-achievements] received tracking', tracking)),
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
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByFn(index, item: AchievementsProgressTracking) {
		return item.id;
	}

	async resetAchievements() {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = { ...prefs, pinnedAchievementIds: [] };
		console.debug('[lottery-achievements] resetting achievements', newPrefs);
		await this.prefs.savePreferences(newPrefs);
	}

	pickRandomAchievements() {
		console.debug('[lottery-achievements] picking achievements');
		this.store.send(new AchievementsTrackRandomAchievementsEvent());
	}
}
