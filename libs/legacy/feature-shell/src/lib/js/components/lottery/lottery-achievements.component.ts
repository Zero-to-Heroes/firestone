import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { Observable } from 'rxjs';
import { AchievementsProgressTracking } from '../../services/achievement/achievements-monitor.service';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
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
			<div class="achievements">
				<lottery-achievement
					*ngFor="let achievement of achievements$ | async"
					class="achievement"
					[achievement]="achievement"
				></lottery-achievement>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotteryAchievementsWidgetComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	achievements$: Observable<readonly AchievementsProgressTracking[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.achievements$ = this.store.achievementsProgressTracking$().pipe(this.mapData((tracking) => tracking));
	}
}
