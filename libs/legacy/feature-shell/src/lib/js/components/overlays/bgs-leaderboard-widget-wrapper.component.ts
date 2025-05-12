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
import { BgsStateFacadeService } from '@firestone/battlegrounds/common';
import { BgsPlayer } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
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
		private readonly state: BgsStateFacadeService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await this.scene.isReady();
		await this.state.isReady();

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.store.listenDeckState$((state) => state.metadata),
			this.store.listenBattlegrounds$(
				([state]) => state?.inGame,
				([state]) => state?.currentGame?.players?.length,
			),
		]).pipe(
			this.mapData(
				([currentScene, [metadata], [inGame, playerCount]]) =>
					isBattlegrounds(metadata.gameType) &&
					currentScene === SceneMode.GAMEPLAY &&
					inGame &&
					(GameType.GT_BATTLEGROUNDS_FRIENDLY === metadata.gameType ||
						(isBattlegrounds(metadata.gameType) && playerCount === 8)),
			),
			this.handleReposition(),
		);
		this.buddiesEnabled$ = this.store
			.listenBattlegrounds$(([state]) => state?.currentGame?.hasBuddies)
			.pipe(this.mapData(([hasBuddies]) => hasBuddies));
		this.bgsPlayers$ = this.state.gameState$$.pipe(
			debounceTime(1000),
			map((state) => state?.currentGame?.players),
			filter((players) => !!players?.length),
			this.mapData((players) =>
				[...players].sort((a: BgsPlayer, b: BgsPlayer) => a.leaderboardPlace - b.leaderboardPlace),
			),
		);
		this.lastOpponentPlayerId$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.lastOpponentPlayerId)
			.pipe(this.mapData(([lastOpponentCardId]) => lastOpponentCardId));
		this.currentTurn$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.currentTurn)
			.pipe(this.mapData(([currentTurn]) => currentTurn));
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
