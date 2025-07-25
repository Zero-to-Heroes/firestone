import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { GameType, SceneMode, isBattlegrounds } from '@firestone-hs/reference-data';
import { BgsPlayer, GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { auditTime, filter, map } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'bgs-leaderboard-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/bgs-leaderboard-widget-wrapper.component.scss'],
	template: `
		<!-- So that we avoid showing other players infos before the start of the match -->
		<ng-container
			*ngIf="{
				bgsPlayers: bgsPlayers$ | async,
				currentTurn: currentTurn$ | async,
				lastOpponentPlayerId: lastOpponentPlayerId$ | async,
				showLastOpponentIcon: showLastOpponentIcon$ | async,
				buddiesEnabled: buddiesEnabled$ | async
			} as value"
		>
			<div class="bgs-leaderboard" *ngIf="showWidget$ | async">
				<bgs-leaderboard-empty-card
					class="opponent-overlay"
					*ngFor="let bgsPlayer of value.bgsPlayers; let i = index; trackBy: trackByFunction"
					[bgsPlayer]="bgsPlayer"
					[currentTurn]="value.currentTurn"
					[lastOpponentPlayerId]="value.lastOpponentPlayerId"
					[showLastOpponentIcon]="value.showLastOpponentIcon"
					[buddiesEnabled]="value.buddiesEnabled"
					[style.left.%]="getLeftOffset(i)"
				>
				</bgs-leaderboard-empty-card>
				<!-- <div class="mouse-leave-fix top"></div>
				<div class="mouse-leave-fix right"></div> -->
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsLeaderboardWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = null;
	protected defaultPositionTopProvider = null;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = null;

	showWidget$: Observable<boolean>;
	bgsPlayers$: Observable<readonly BgsPlayer[]>;
	lastOpponentPlayerId$: Observable<number>;
	currentTurn$: Observable<number>;
	showLastOpponentIcon$: Observable<boolean>;
	buddiesEnabled$: Observable<boolean>;
	windowWidth: number;
	windowHeight: number;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly state: GameStateFacadeService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.state);

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.state.gameState$$.pipe(
				auditTime(1000),
				this.mapData(
					(state) =>
						state.gameStarted &&
						!state.gameEnded &&
						isBattlegrounds(state.metadata?.gameType) &&
						(GameType.GT_BATTLEGROUNDS_FRIENDLY === state.metadata.gameType ||
							state.bgState.currentGame?.players?.length === 8),
				),
			),
		]).pipe(
			this.mapData(([currentScene, displayFromState]) => displayFromState && currentScene === SceneMode.GAMEPLAY),
			this.handleReposition(),
		);
		this.buddiesEnabled$ = this.state.gameState$$.pipe(
			auditTime(1000),
			this.mapData((state) => state.bgState.currentGame?.hasBuddies),
		);
		this.bgsPlayers$ = this.state.gameState$$.pipe(
			auditTime(1000),
			map((state) => state.bgState.currentGame?.players),
			filter((players) => !!players?.length),
			this.mapData((players) =>
				[...players].sort((a: BgsPlayer, b: BgsPlayer) => a.leaderboardPlace - b.leaderboardPlace),
			),
		);
		this.lastOpponentPlayerId$ = this.state.gameState$$.pipe(
			auditTime(1000),
			this.mapData((state) => state.bgState.currentGame?.lastOpponentPlayerId),
		);
		this.currentTurn$ = this.state.gameState$$.pipe(
			auditTime(1000),
			this.mapData((state) => (state.currentTurn === 'mulligan' ? 0 : state.currentTurn)),
		);
		this.showLastOpponentIcon$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsShowLastOpponentIconInOverlay),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	getLeftOffset(index: number): number {
		return -index;
	}

	trackByFunction(index: number, player: BgsPlayer) {
		return player.cardId;
	}
}
