import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input } from '@angular/core';
import { BgsPostMatchStatsPanel } from '../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { BgsStatsFilterId } from '../../models/battlegrounds/post-match/bgs-stats-filter-id.type';
import { NavigationReplays } from '../../models/mainwindow/navigation/navigation-replays';
import { MatchDetail } from '../../models/mainwindow/replays/match-detail';
import { ReplaysState } from '../../models/mainwindow/replays/replays-state';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { ChangeMatchStatsNumberOfTabsEvent } from '../../services/mainwindow/store/events/replays/change-match-stats-number-of-tabs-event';
import { SelectMatchStatsTabEvent } from '../../services/mainwindow/store/events/replays/select-match-stats-tab-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'match-details',
	styleUrls: [`../../../css/component/replays/match-details.component.scss`],
	template: `
		<div class="match-details {{ selectedView }}">
			<replay-info [replay]="replayInfo" *ngIf="replayInfo"></replay-info>
			<game-replay [replay]="selectedReplay" *ngIf="selectedView === 'replay'"></game-replay>
			<bgs-post-match-stats
				*ngIf="selectedView === 'match-stats'"
				[panel]="panel"
				[mainPlayerCardId]="playerCardId"
				[inputMmr]="mmr"
				[selectedTabs]="selectedTabs"
				[selectTabHandler]="selectTabHandler"
				[changeTabsNumberHandler]="changeTabsNumberHandler"
				[showSocialShares]="false"
				emptyTitle="Nothing here"
				emptySubtitle="We couldn't retrieve the stats"
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
export class MatchDetailsComponent implements AfterViewInit {
	@Input() set state(value: ReplaysState) {
		// Do nothing, not used for now
	}

	@Input() set navigation(value: NavigationReplays) {
		this.selectedView = value.currentView === 'match-details' ? value.selectedTab : null;
		this.selectedReplay = value.selectedReplay;
		this.replayInfo = value.selectedReplay?.replayInfo;
		this.panel = value.selectedReplay?.bgsPostMatchStatsPanel;
		this.playerCardId = this.panel?.player?.cardId;
		this.mmr = parseInt(value.selectedReplay?.replayInfo?.playerRank);
		this.selectedTabs = value.selectedStatsTabs.slice(0, value.numberOfDisplayedTabs);
	}

	selectedView: string;
	selectedReplay: MatchDetail;
	selectedTabs: readonly BgsStatsFilterId[];
	replayInfo: GameStat;
	mmr: number;
	playerCardId: string;
	panel: BgsPostMatchStatsPanel;

	selectTabHandler: (tab: string, tabIndex: number) => void = (tab: BgsStatsFilterId, tabIndex: number) => {
		this.stateUpdater.next(new SelectMatchStatsTabEvent(tab, tabIndex));
	};

	changeTabsNumberHandler = (numbersOfTabs: number) => {
		this.stateUpdater.next(new ChangeMatchStatsNumberOfTabsEvent(numbersOfTabs));
	};

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService, private el: ElementRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}
}
