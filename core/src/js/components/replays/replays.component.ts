import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';
import { CurrentViewType } from '../../models/mainwindow/replays/current-view.type';
import { Preferences } from '../../models/preferences';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'replays',
	styleUrls: [
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/replays/replays.component.scss`,
	],
	template: `
		<div class="app-section replays" *ngIf="currentView$ | async as currentView">
			<section class="main divider">
				<with-loading [isLoading]="loading$ | async">
					<div class="content main-content">
						<global-header *ngIf="showGlobalHeader$ | async"> </global-header>
						<replays-list *ngIf="currentView === 'list'"></replays-list>
						<match-details
							[navigation]="navigation.navigationReplays"
							*ngIf="currentView === 'match-details'"
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
				<div class="replays-list" *ngIf="isShowingDuelsReplay()">
					<duels-replays-recap-for-run
						[state]="state?.duels"
						[navigation]="navigation?.navigationReplays"
					></duels-replays-recap-for-run>
				</div>
				<secondary-default
					*ngIf="
						currentView === 'list' ||
						(currentView === 'match-details' &&
							!navigation.navigationReplays.selectedReplay?.replayInfo?.isDuels() &&
							!navigation?.navigationReplays?.selectedReplay?.bgsPostMatchStatsPanel?.player?.cardId)
					"
				></secondary-default>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	showGlobalHeader$: Observable<boolean>;
	currentView$: Observable<CurrentViewType>;

	@Input() navigation: NavigationState;
	@Input() state: MainWindowState;
	@Input() prefs: Preferences;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.loading$ = this.store
			.listen$(([main, nav, prefs]) => main.replays.isLoading)
			.pipe(this.mapData(([isLoading]) => isLoading));
		this.showGlobalHeader$ = this.store
			.listen$(([main, nav, prefs]) => nav.text)
			.pipe(this.mapData(([text]) => !!text));
		this.currentView$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationReplays.currentView)
			.pipe(this.mapData(([currentView]) => currentView));
	}

	isShowingDuelsReplay(): boolean {
		return (
			this.navigation.navigationReplays?.currentView === 'match-details' &&
			this.navigation.navigationReplays?.selectedReplay?.replayInfo?.isDuels()
		);
	}
}
