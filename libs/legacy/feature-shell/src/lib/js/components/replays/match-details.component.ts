import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { MainWindowNavigationService, MatchDetail } from '@firestone/mainwindow/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'match-details',
	styleUrls: [`../../../css/component/replays/match-details.component.scss`],
	template: `
		<div
			class="match-details {{ value.selectedView }}"
			*ngIf="{ selectedView: selectedView$ | async, selectedReplay: selectedReplay$ | async } as value"
		>
			<replay-info
				[replay]="value.selectedReplay?.replayInfo"
				*ngIf="value.selectedReplay?.replayInfo"
			></replay-info>
			<game-replay [replay]="value.selectedReplay" *ngIf="value.selectedView === 'replay'"></game-replay>
			<bgs-post-match-stats
				*ngIf="value.selectedView === 'match-stats'"
				[panel]="value.selectedReplay?.bgsPostMatchStatsPanel"
				[mainPlayerId]="value.selectedReplay?.bgsPostMatchStatsPanel?.player?.playerId"
				[mmr]="parseInt(value.selectedReplay?.replayInfo?.playerRank)"
				[showSocialShares]="false"
				[emptyTitle]="'app.replays.bg-stats.empty-state-title' | owTranslate"
				[emptySubtitle]="'app.replays.bg-stats.empty-state-subtitle' | owTranslate"
				[loadingTitle]="null"
				[loadingSubtitle]="null"
				[hideDefaultLoadingSubtitle]="true"
				[loadingSvg]="'loading-spiral'"
				[showHints]="false"
			></bgs-post-match-stats>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchDetailsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	selectedView$: Observable<string>;
	selectedReplay$: Observable<MatchDetail>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: MainWindowNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav);

		this.selectedView$ = this.nav.navigationState$$.pipe(
			this.mapData((state) =>
				state.navigationReplays.currentView === 'match-details' ? state.navigationReplays.selectedTab : null,
			),
		);
		this.selectedReplay$ = this.nav.navigationState$$.pipe(
			this.mapData((state) => state.navigationReplays.selectedReplay),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	parseInt(value: string | number): number {
		return parseInt('' + value);
	}
}
