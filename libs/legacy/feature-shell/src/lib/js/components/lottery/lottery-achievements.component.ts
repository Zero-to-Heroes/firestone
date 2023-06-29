import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { sortByProperties } from '@firestone/shared/framework/common';
import { Observable, tap } from 'rxjs';
import { AchievementsProgressTracking } from '../../services/achievement/achievements-monitor.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';

@Component({
	selector: 'lottery-achievements',
	styleUrls: [
		'../../../css/component/lottery/lottery-section.scss',
		'../../../css/component/lottery/lottery-achievements.component.scss',
	],
	template: `
		<div class="main-content">
			<div class="title">
				<div class="text" [owTranslate]="'app.lottery.achievements-title'"></div>
			</div>
			<div class="achievements" *ngIf="achievements$ | async as achievements; else emptyState">
				<lottery-achievement
					*ngFor="let achievement of achievements; trackBy: trackByFn"
					class="achievement"
					[achievement]="achievement"
				></lottery-achievement>
			</div>
			<ng-template #emptyState
				><div class="empty-state" [owTranslate]="'app.lottery.achievements-empty-state'"></div>
			</ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotteryAchievementsWidgetComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	achievements$: Observable<readonly AchievementsProgressTracking[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
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
}
