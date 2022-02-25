import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { BgsPostMatchStatsPanel } from '../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { CurrentViewType } from '../../models/mainwindow/replays/current-view.type';
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
						<match-details *ngIf="currentView === 'match-details'"></match-details>
					</div>
				</with-loading>
			</section>
			<section
				class="secondary"
				*ngIf="{
					bgsPostMatchStatsPanel: bgsPostMatchStatsPanel$ | async,
					isShowingDuels: isShowingDuels$ | async
				} as value"
			>
				<div class="match-stats" *ngIf="value.bgsPostMatchStatsPanel?.player?.cardId">
					<div class="title" [owTranslate]="'app.replays.bg-stats.title'"></div>
					<bgs-post-match-stats-recap [stats]="value.bgsPostMatchStatsPanel"></bgs-post-match-stats-recap>
				</div>
				<div class="replays-list" *ngIf="value.isShowingDuels && currentView === 'match-details'">
					<duels-replays-recap-for-run></duels-replays-recap-for-run>
				</div>
				<secondary-default
					*ngIf="
						currentView === 'list' ||
						(currentView === 'match-details' &&
							!value.isShowingDuels &&
							!value.bgsPostMatchStatsPanel?.player?.cardId)
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
	bgsPostMatchStatsPanel$: Observable<BgsPostMatchStatsPanel>;
	isShowingDuels$: Observable<boolean>;

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
		this.bgsPostMatchStatsPanel$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationReplays.selectedReplay?.bgsPostMatchStatsPanel)
			.pipe(this.mapData(([bgsPostMatchStatsPanel]) => bgsPostMatchStatsPanel));
		this.isShowingDuels$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationReplays.selectedReplay?.replayInfo)
			.pipe(this.mapData(([replayInfo]) => replayInfo?.isDuels()));
	}
}
