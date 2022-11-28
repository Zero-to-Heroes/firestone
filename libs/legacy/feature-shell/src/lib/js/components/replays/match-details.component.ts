import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { BgsStatsFilterId } from '../../models/battlegrounds/post-match/bgs-stats-filter-id.type';
import { MatchDetail } from '../../models/mainwindow/replays/match-detail';
import { ChangeMatchStatsNumberOfTabsEvent } from '../../services/mainwindow/store/events/replays/change-match-stats-number-of-tabs-event';
import { SelectMatchStatsTabEvent } from '../../services/mainwindow/store/events/replays/select-match-stats-tab-event';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
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
				[mainPlayerCardId]="value.selectedReplay?.bgsPostMatchStatsPanel?.player?.cardId"
				[mmr]="parseInt(value.selectedReplay?.replayInfo?.playerRank)"
				[selectedTabs]="selectedTabs$ | async"
				[selectTabHandler]="selectTabHandler"
				[changeTabsNumberHandler]="changeTabsNumberHandler"
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
	selectedTabs$: Observable<readonly BgsStatsFilterId[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.selectedView$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationReplays)
			.pipe(this.mapData(([nav]) => (nav.currentView === 'match-details' ? nav.selectedTab : null)));
		this.selectedReplay$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationReplays.selectedReplay)
			.pipe(this.mapData(([selectedReplay]) => selectedReplay));
		this.selectedTabs$ = this.store
			.listen$(
				([main, nav, prefs]) => nav.navigationReplays.selectedStatsTabs,
				([main, nav, prefs]) => nav.navigationReplays.numberOfDisplayedTabs,
			)
			.pipe(
				this.mapData(([selectedStatsTabs, numberOfDisplayedTabs]) =>
					selectedStatsTabs.slice(0, numberOfDisplayedTabs),
				),
			);
	}

	selectTabHandler: (tab: string, tabIndex: number) => void = (tab: BgsStatsFilterId, tabIndex: number) => {
		this.store.send(new SelectMatchStatsTabEvent(tab, tabIndex));
	};

	changeTabsNumberHandler = (numbersOfTabs: number) => {
		this.store.send(new ChangeMatchStatsNumberOfTabsEvent(numbersOfTabs));
	};

	parseInt(value: string | number): number {
		return parseInt('' + value);
	}
}
