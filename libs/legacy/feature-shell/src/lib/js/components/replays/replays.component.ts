import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
import { BgsPostMatchStatsPanel } from '@firestone/game-state';
import { CurrentViewType, MainWindowNavigationService } from '@firestone/mainwindow/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

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
					bgsPostMatchStatsPanel: bgsPostMatchStatsPanel$ | async,
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
export class ReplaysComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	showGlobalHeader$: Observable<boolean>;
	currentView$: Observable<CurrentViewType>;
	bgsPostMatchStatsPanel$: Observable<BgsPostMatchStatsPanel>;
	showAds$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: MainWindowNavigationService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.ads);

		this.showGlobalHeader$ = this.nav.text$$.pipe(this.mapData((text) => !!text));
		this.currentView$ = this.nav.navigationState$$.pipe(
			this.mapData((state) => state.navigationReplays.currentView),
		);
		this.bgsPostMatchStatsPanel$ = this.nav.navigationState$$.pipe(
			this.mapData((state) => state.navigationReplays.selectedReplay?.bgsPostMatchStatsPanel),
		);
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((info) => !info));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	showSidebar(currentView: CurrentViewType, bgsPlayerCardId: string): boolean {
		return !(currentView === 'list' || (currentView === 'match-details' && !bgsPlayerCardId));
	}
}
