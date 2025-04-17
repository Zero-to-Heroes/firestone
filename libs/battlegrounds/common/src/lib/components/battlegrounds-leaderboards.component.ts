/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { LeaderboardEntry } from '@firestone-hs/official-leaderboards';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, getDateAgo } from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, filter, tap } from 'rxjs';
import { BattlegroundsOfficialLeaderboardService } from '../services/bgs-official-leaderboards.service';

@Component({
	selector: 'battlegrounds-leaderboards',
	styleUrls: ['./battlegrounds-leaderboards.component.scss'],
	template: `
		<div class="leaderboards" *ngIf="{ leaderboard: leaderboard$ | async } as value">
			<div class="data-info">
				<div class="label" [fsTranslate]="'app.decktracker.meta.last-updated'"></div>
				<div class="value" [helpTooltip]="lastUpdateFull$ | async">{{ lastUpdate$ | async }}</div>
			</div>

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
	lastUpdate$: Observable<string | null>;
	lastUpdateFull$: Observable<string | null>;

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
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					region: prefs.bgsLeaderboardRegionFilter,
					bgsLeaderboardPlayerSearch: prefs.bgsLeaderboardPlayerSearch,
				})),
				distinctUntilChanged(
					(a, b) =>
						a?.bgsLeaderboardPlayerSearch === b?.bgsLeaderboardPlayerSearch && a?.region === b?.region,
				),
			),
		]).pipe(
			tap((data) => console.debug('[bgs-leaderboards] received data', data)),
			filter(
				([leaderboards, { region, bgsLeaderboardPlayerSearch }]) =>
					!!leaderboards?.leaderboards?.length && !!region,
			),
			this.mapData(([leaderboards, { region, bgsLeaderboardPlayerSearch }]) => {
				const entries =
					leaderboards!.leaderboards!.find((leaderboard) => leaderboard.region === region)?.entries ?? [];
				return !bgsLeaderboardPlayerSearch?.length
					? entries
					: entries.filter((entry) =>
							entry.accountId.toLocaleLowerCase().includes(bgsLeaderboardPlayerSearch.toLowerCase()),
					  );
			}),
		);
		this.lastUpdate$ = this.leaderboardsService.leaderboards$$.pipe(
			this.mapData((stats) => {
				if (!stats?.lastUpdate) {
					return null;
				}
				// Show the date as a relative date, unless it's more than 1 week old
				// E.g. "2 hours ago", "3 days ago", "1 week ago", "on 12/12/2020"
				const date = new Date(stats.lastUpdate);
				const now = new Date();
				const diff = now.getTime() - date.getTime();
				const days = diff / (1000 * 3600 * 24);
				if (days < 7) {
					return getDateAgo(date, this.i18n);
				}
				return date.toLocaleDateString(this.i18n.formatCurrentLocale() ?? 'enUS');
			}),
		);
		this.lastUpdateFull$ = this.leaderboardsService.leaderboards$$.pipe(
			this.mapData((stats) => {
				if (!stats?.lastUpdate) {
					return null;
				}
				const date = new Date(stats.lastUpdate);
				return date.toLocaleDateString(this.i18n.formatCurrentLocale() ?? 'enUS', {
					year: 'numeric',
					month: 'numeric',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric',
				});
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
