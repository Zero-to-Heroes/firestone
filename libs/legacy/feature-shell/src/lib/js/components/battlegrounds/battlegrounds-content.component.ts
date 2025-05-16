import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BgsInGameWindowNavigationService } from '@firestone/battlegrounds/common';
import { BgsFaceOffWithSimulation, BgsPanel, GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { AnalyticsService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { auditTime, filter, startWith } from 'rxjs/operators';
import { AdService } from '../../services/ad.service';

@Component({
	selector: 'battlegrounds-content',
	styleUrls: [`../../../css/component/battlegrounds/battlegrounds-content.component.scss`],
	template: `
		<div class="battlegrounds">
			<section
				class="content-container"
				*ngIf="{ currentPanelId: currentPanelId$ | async, currentPanel: currentPanel$ | async } as value"
			>
				<div class="title" *ngIf="showTitle$ | async">{{ value.currentPanel?.name }}</div>
				<ng-container>
					<bgs-hero-selection-overview *ngIf="value.currentPanelId === 'bgs-hero-selection-overview'">
					</bgs-hero-selection-overview>
					<bgs-next-opponent-overview *ngIf="value.currentPanelId === 'bgs-next-opponent-overview'">
					</bgs-next-opponent-overview>
					<bgs-post-match-stats
						*ngIf="value.currentPanelId === 'bgs-post-match-stats'"
						[panel]="value.currentPanel"
						[reviewId]="reviewId$ | async"
						[faceOffs]="faceOffs$ | async"
						[mmr]="mmr$ | async"
						[gameEnded]="gameEnded$ | async"
						[mainPlayerId]="mainPlayerId$ | async"
					>
					</bgs-post-match-stats>
					<bgs-battles *ngIf="value.currentPanelId === 'bgs-battles'"> </bgs-battles>
				</ng-container>
			</section>
		</div>
		<ads *ngIf="showAds$ | async"></ads>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsContentComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit, OnDestroy
{
	showTitle$: Observable<boolean>;
	currentPanelId$: Observable<string>;
	currentPanel$: Observable<BgsPanel | any>;
	reviewId$: Observable<string>;
	mainPlayerId$: Observable<number>;
	mmr$: Observable<number>;
	gameEnded$: Observable<boolean>;
	faceOffs$: Observable<readonly BgsFaceOffWithSimulation[]>;
	showAds$: Observable<boolean>;

	windowId: string;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
		private readonly ads: AdService,
		private readonly nav: BgsInGameWindowNavigationService,
		private readonly gameState: GameStateFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads, this.gameState, this.nav, this.prefs);

		this.currentPanelId$ = this.nav.currentPanelId$$.pipe(this.mapData((currentPanelId) => currentPanelId));
		this.currentPanelId$.subscribe((currentApp) => {
			this.analytics.trackPageView(currentApp);
		});
		this.currentPanel$ = combineLatest([this.gameState.gameState$$, this.nav.currentPanelId$$]).pipe(
			auditTime(1000),
			filter(([gameState, currentPanelId]) => !!gameState.bgState?.panels?.length && !!currentPanelId),
			this.mapData(([gameState, currentPanelId]) =>
				gameState.bgState.panels.find((panel) => panel.id === currentPanelId),
			),
		);
		this.showTitle$ = combineLatest(
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsShowNextOpponentRecapSeparately)),
			this.currentPanelId$,
		).pipe(
			this.mapData(
				([showNextOpponentRecapSeparately, currentPanelId]) =>
					showNextOpponentRecapSeparately || currentPanelId !== 'bgs-next-opponent-overview',
			),
		);
		this.reviewId$ = this.gameState.gameState$$.pipe(this.mapData((gameState) => gameState.reviewId));
		this.mainPlayerId$ = this.gameState.gameState$$.pipe(
			auditTime(1000),
			this.mapData((gameState) => gameState?.bgState?.currentGame?.getMainPlayer()?.playerId),
		);
		this.mmr$ = this.gameState.gameState$$.pipe(
			auditTime(1000),
			this.mapData((gameState) => gameState?.bgState?.currentGame?.mmrAtStart),
		);
		this.gameEnded$ = this.gameState.gameState$$.pipe(
			auditTime(1000),
			this.mapData((gameState) => gameState?.gameEnded),
		);
		this.faceOffs$ = this.gameState.gameState$$.pipe(
			auditTime(1000),
			this.mapData((gameState) => gameState?.bgState?.currentGame?.faceOffs),
		);
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(
			this.mapData((showAds) => !showAds),
			startWith(true),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
	}
}
