import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
} from '@angular/core';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { BgsFaceOffWithSimulation } from '../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsPanel } from '../../models/battlegrounds/bgs-panel';
import { OverwolfService } from '../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../services/ui-store/app-ui-store.service';
import { areDeepEqual } from '../../services/utils';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'battlegrounds-content',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/battlegrounds/battlegrounds-content.component.scss`,
	],
	template: `
		<div class="battlegrounds">
			<section class="menu-bar">
				<div class="first">
					<div class="navigation">
						<i class="i-117X33 gold-theme logo">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#logo" />
							</svg>
						</i>
						<menu-selection-bgs></menu-selection-bgs>
					</div>
				</div>
				<hotkey class="exclude-dbclick" [hotkeyName]="'battlegrounds'"></hotkey>
				<div class="controls exclude-dbclick">
					<control-bug></control-bug>
					<control-settings [windowId]="windowId" [settingsApp]="'battlegrounds'"></control-settings>
					<control-discord></control-discord>
					<control-minimize [windowId]="windowId"></control-minimize>
					<control-maximize
						[windowId]="windowId"
						[doubleClickListenerParentClass]="'menu-bar'"
						[exludeClassForDoubleClick]="'exclude-dbclick'"
					></control-maximize>
					<control-close
						[windowId]="windowId"
						[eventProvider]="closeHandler"
						[closeAll]="true"
					></control-close>
				</div>
			</section>
			<section
				class="content-container"
				*ngIf="{ currentPanelId: currentPanelId$ | async, currentPanel: currentPanel$ | async } as value"
			>
				<div class="title">{{ value.currentPanel?.name }}</div>
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
					>
					</bgs-post-match-stats>
					<bgs-battles *ngIf="value.currentPanelId === 'bgs-battles'"> </bgs-battles>
				</ng-container>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsContentComponent extends AbstractSubscriptionComponent implements AfterViewInit, OnDestroy {
	currentPanelId$: Observable<string>;
	currentPanel$: Observable<BgsPanel>;
	reviewId$: Observable<string>;
	mmr$: Observable<number>;
	gameEnded$: Observable<boolean>;
	faceOffs$: Observable<readonly BgsFaceOffWithSimulation[]>;
	// currentGame$: Observable<BgsGame>;

	windowId: string;

	closeHandler: () => void;

	constructor(
		private readonly ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		this.currentPanelId$ = this.store
			.listenBattlegrounds$(([state]) => state.currentPanelId)
			.pipe(
				filter(([currentPanelId]) => !!currentPanelId),
				map(([currentPanelId]) => currentPanelId),
				distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting currentPanelId in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.currentPanel$ = this.store
			.listenBattlegrounds$(
				([state]) => state.panels,
				([state]) => state.currentPanelId,
			)
			.pipe(
				debounceTime(200),
				filter(([panels, currentPanelId]) => !!panels?.length && !!currentPanelId),
				map(([panels, currentPanelId]) => panels.find((panel) => panel.id === currentPanelId)),
				distinctUntilChanged((a, b) => areDeepEqual(a, b)),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting currentPanel in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.reviewId$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame)
			.pipe(
				map(([currentGame]) => currentGame?.reviewId),
				distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting reviewId in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.mmr$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame)
			.pipe(
				map(([currentGame]) => currentGame?.mmrAtStart),
				distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting mmr in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.gameEnded$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame)
			.pipe(
				map(([currentGame]) => currentGame?.gameEnded),
				distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting gameEnded in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.faceOffs$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.faceOffs)
			.pipe(
				debounceTime(1000),
				filter(([faceOffs]) => !!faceOffs?.length),
				map(([faceOffs]) => faceOffs),
				distinctUntilChanged((a, b) => areDeepEqual(a, b)),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((faceOff) => console.debug('[cd] emitting face offs in ', this.constructor.name, faceOff)),
				takeUntil(this.destroyed$),
			);
		// this.currentGame$ = this.store
		// 	.listenBattlegrounds$(([state]) => state.currentGame)
		// 	.pipe(
		// 		debounceTime(1000),
		// 		// TODO: narrow down the model to avoid having too many refreshes
		// 		map(([currentGame]) => currentGame),
		// 		// FIXME
		// 		tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
		// 		tap((info) => cdLog('emitting currentGame in ', this.constructor.name, info)),
		// 		takeUntil(this.destroyed$),
		// 	);
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
	}
}
