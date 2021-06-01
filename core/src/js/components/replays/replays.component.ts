import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';
import { Preferences } from '../../models/preferences';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'replays',
	styleUrls: [
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/replays/replays.component.scss`,
	],
	template: `
		<div class="app-section replays">
			<section class="main divider">
				<with-loading [isLoading]="state.replays.isLoading">
					<div class="content main-content">
						<global-header [navigation]="navigation" *ngIf="navigation.text"> </global-header>
						<replays-list
							[state]="state.replays"
							[prefs]="prefs"
							*ngxCacheIf="navigation.navigationReplays.currentView === 'list'"
						></replays-list>
						<match-details
							[state]="state.replays"
							[navigation]="navigation.navigationReplays"
							*ngxCacheIf="navigation.navigationReplays.currentView === 'match-details'"
						></match-details>
					</div>
				</with-loading>
			</section>
			<section class="secondary">
				<div
					class="match-stats"
					*ngIf="navigation?.navigationReplays?.selectedReplay?.bgsPostMatchStatsPanel?.player?.cardId"
				>
					<div class="title">Match Stats</div>
					<bgs-post-match-stats-recap
						[stats]="navigation?.navigationReplays?.selectedReplay?.bgsPostMatchStatsPanel"
					></bgs-post-match-stats-recap>
				</div>
				<div class="replays-list" *ngxCacheIf="isShowingDuelsReplay()">
					<duels-replays-recap-for-run
						[state]="state"
						[navigation]="navigation"
					></duels-replays-recap-for-run>
				</div>
				<secondary-default
					*ngxCacheIf="
						navigation.navigationReplays.currentView === 'list' ||
						(navigation.navigationReplays.currentView === 'match-details' &&
							!navigation.navigationReplays.selectedReplay?.replayInfo?.isDuels() &&
							!navigation?.navigationReplays?.selectedReplay?.bgsPostMatchStatsPanel?.player?.cardId)
					"
				></secondary-default>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysComponent implements AfterViewInit {
	@Input() navigation: NavigationState;
	@Input() state: MainWindowState;
	@Input() prefs: Preferences;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	isShowingDuelsReplay(): boolean {
		return (
			this.navigation.navigationReplays.currentView === 'match-details' &&
			this.navigation.navigationReplays.selectedReplay?.replayInfo?.isDuels()
		);
	}
}
