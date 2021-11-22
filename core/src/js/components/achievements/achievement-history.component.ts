import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'achievement-history',
	styleUrls: [
		`../../../css/component/achievements/achievement-history.component.scss`,
		`../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="achievement-history">
			<div class="history" scrollable>
				<div class="top-container">
					<span class="title">My Achievements History</span>
				</div>
				<ul *ngIf="{ achievementsHistory: achievementHistory$ | async } as value">
					<li *ngFor="let historyItem of value.achievementHistory; trackBy: trackById">
						<achievement-history-item [historyItem]="historyItem"></achievement-history-item>
					</li>
					<section
						*ngIf="!value.achievementHistory || value.achievementHistory.length === 0"
						class="empty-state"
					>
						<i class="i-60x78 pale-theme">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#empty_state_my_card_history" />
							</svg>
						</i>
						<span>No history yet</span>
						<span>Complete an achievement to start one!</span>
					</section>
				</ul>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementHistoryComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	achievementHistory$: Observable<readonly AchievementHistory[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.achievementHistory$ = this.store
			.listen$(([main, nav, prefs]) => main.achievements.achievementHistory)
			.pipe(this.mapData(([history]) => history));
	}

	trackById(index, history: AchievementHistory) {
		return history.id;
	}
}
