/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { LeaderboardEntry } from '@firestone-hs/official-leaderboards';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { Observable, combineLatest, filter, tap } from 'rxjs';
import { BattlegroundsOfficialLeaderboardService } from '../services/bgs-official-leaderboards.service';

@Component({
	selector: 'battlegrounds-leaderboards',
	styleUrls: ['./battlegrounds-leaderboards.component.scss'],
	template: `
		<div class="leaderboards" *ngIf="{ leaderboard: leaderboard$ | async } as value">
			<li class="leaderboard-header">
				<div class="cell rank" [fsTranslate]="'app.duels.leaderboard.rank'"></div>
				<div class="cell rating" [fsTranslate]="'app.duels.leaderboard.rating'"></div>
				<div class="cell name" [fsTranslate]="'app.duels.leaderboard.name'"></div>
			</li>
			<virtual-scroller
				#scroll
				[items]="value.leaderboard!"
				[bufferAmount]="25"
				role="list"
				class="leaderboard-entries"
				scrollable
			>
				<li class="leaderboard-entry" *ngFor="let entry of scroll.viewPortItems; trackBy: trackByFn">
					<div class="cell rank">{{ entry.rank }}</div>
					<div class="cell rating">{{ entry.rating }}</div>
					<div class="cell name">{{ entry.accountId }}</div>
				</li>
			</virtual-scroller>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsLeaderboardsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	leaderboard$: Observable<LeaderboardEntry[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly leaderboardsService: BattlegroundsOfficialLeaderboardService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.leaderboardsService.isReady();
		await this.prefs.isReady();

		this.leaderboard$ = combineLatest([
			this.leaderboardsService.leaderboards$$,
			this.prefs.preferences$(
				(prefs) => prefs.bgsLeaderboardRegionFilter,
				(prefs) => prefs.bgsLeaderboardPlayerSearch,
			),
		]).pipe(
			tap((data) => console.debug('[bgs-leaderboards] received data', data)),
			filter(
				([leaderboards, [region, bgsLeaderboardPlayerSearch]]) =>
					!!leaderboards?.leaderboards?.length && !!region,
			),
			this.mapData(([leaderboards, [region, bgsLeaderboardPlayerSearch]]) => {
				const entries = leaderboards!.leaderboards!.find(
					(leaderboard) => leaderboard.region === region,
				)!.entries;
				return !bgsLeaderboardPlayerSearch?.length
					? entries
					: entries.filter((entry) => entry.accountId.includes(bgsLeaderboardPlayerSearch));
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByFn(index: number, entry: LeaderboardEntry) {
		return entry.rank;
	}
}
