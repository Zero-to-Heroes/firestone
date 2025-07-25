import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BgsPostMatchStatsPanel } from '@firestone/game-state';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { CurrentViewType } from '../../models/mainwindow/replays/current-view.type';
import { AdService } from '../../services/ad.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

@Component({
	standalone: false,
	selector: 'replays',
	styleUrls: [
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/replays/replays.component.scss`,
	],
	template: `
		<div class="app-section replays" *ngIf="currentView$ | async as currentView">
			<section class="main divider">
				<with-loading>
					<div class="content main-content">
						<global-header *ngIf="showGlobalHeader$ | async"> </global-header>
						<replays-list *ngIf="currentView === 'list'"></replays-list>
						<match-details *ngIf="currentView === 'match-details'"></match-details>
					</div>
				</with-loading>
			</section>

			<ng-container
				*ngIf="{
					bgsPostMatchStatsPanel: bgsPostMatchStatsPanel$ | async
				} as value"
			>
				<section
					class="secondary"
					*ngIf="
						!(showAds$ | async) && showSidebar(currentView, value.bgsPostMatchStatsPanel?.player?.cardId)
					"
				>
					<div class="match-stats" *ngIf="value.bgsPostMatchStatsPanel?.player?.cardId">
						<div class="title" [owTranslate]="'app.replays.bg-stats.title'"></div>
						<bgs-post-match-stats-recap [stats]="value.bgsPostMatchStatsPanel"></bgs-post-match-stats-recap>
					</div>
				</section>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	showGlobalHeader$: Observable<boolean>;
	currentView$: Observable<CurrentViewType>;
	bgsPostMatchStatsPanel$: Observable<BgsPostMatchStatsPanel>;
	showAds$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: MainWindowNavigationService,
		private readonly ads: AdService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.ads);

		this.showGlobalHeader$ = this.nav.text$$.pipe(this.mapData((text) => !!text));
		this.currentView$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationReplays.currentView)
			.pipe(this.mapData(([currentView]) => currentView));
		this.bgsPostMatchStatsPanel$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationReplays.selectedReplay?.bgsPostMatchStatsPanel)
			.pipe(this.mapData(([bgsPostMatchStatsPanel]) => bgsPostMatchStatsPanel));
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((info) => !info));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	showSidebar(currentView: CurrentViewType, bgsPlayerCardId: string): boolean {
		return !(currentView === 'list' || (currentView === 'match-details' && !bgsPlayerCardId));
	}
}
