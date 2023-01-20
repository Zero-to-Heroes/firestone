import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { DuelsLeaderboardEntry } from '@firestone-hs/duels-leaderboard';
import { BnetRegion } from '@firestone-hs/reference-data';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'duels-leaderboard',
	styleUrls: [`../../../../css/component/duels/desktop/duels-leaderboard.component.scss`],
	template: `
		<div class="duels-leaderboard">
			<div class="duels-leaderboard-entry-container">
				<li class="duels-leaderboard-entry header">
					<div class="rank" [owTranslate]="'app.duels.leaderboard.rank' | owTranslate"></div>
					<div class="rating" [owTranslate]="'app.duels.leaderboard.rating' | owTranslate"></div>
					<div class="name" [owTranslate]="'app.duels.leaderboard.name' | owTranslate"></div>
					<div class="region" [owTranslate]="'app.duels.leaderboard.region' | owTranslate"></div>
				</li>
				<ul class="entries" scrollable>
					<li
						class="duels-leaderboard-entry"
						[ngClass]="{ your: value.isPlayer, 'top-3': value.rank <= 3, 'top-10': value.rank <= 10 }"
						*ngFor="let value of values$ | async; trackBy: trackValue"
					>
						<div class="rank">{{ value.rank }}</div>
						<div class="rating">{{ value.rating }}</div>
						<div class="name">{{ value.playerName }} {{ value.isPlayer ? ' (You)' : '' }}</div>
						<div class="region">{{ getRegion(value.region) }}</div>
					</li>
				</ul>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsLeaderboardComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	values$: Observable<readonly DuelsLeaderboardEntry[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.values$ = this.store
			.listen$(
				([main, nav]) => main.duels.leaderboard,
				([main, nav, prefs]) => prefs.duelsActiveLeaderboardModeFilter,
			)
			.pipe(
				filter(([stats, filter]) => !!stats && !!filter),
				this.mapData(([stats, filter]) => (filter === 'paid-duels' ? stats.heroic : stats.casual)),
			);
	}

	getRegion(region: BnetRegion): string {
		return region ? this.i18n.translateString(`global.region.${BnetRegion[region]?.toLowerCase()}`) : '-';
	}

	trackValue(index: number, entry: DuelsLeaderboardEntry) {
		return entry.playerName;
	}
}
