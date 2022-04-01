import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { GameType, SceneMode } from '@firestone-hs/reference-data';
import {} from 'jszip';
import {} from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { BgsPlayer } from '../../models/battlegrounds/bgs-player';
import { isBattlegrounds } from '../../services/battlegrounds/bgs-utils';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../services/ui-store/app-ui-store.service';
import { areDeepEqual } from '../../services/utils';
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
				lastOpponentCardId: lastOpponentCardId$ | async,
				showLastOpponentIcon: showLastOpponentIcon$ | async
			} as value"
		>
			<div class="bgs-leaderboard" *ngIf="showWidget$ | async">
				<bgs-leaderboard-empty-card
					class="opponent-overlay"
					*ngFor="let bgsPlayer of value.bgsPlayers; let i = index; trackBy: trackByFunction"
					[bgsPlayer]="bgsPlayer"
					[currentTurn]="value.currentTurn"
					[lastOpponentCardId]="value.lastOpponentCardId"
					[showLastOpponentIcon]="value.showLastOpponentIcon"
				>
				</bgs-leaderboard-empty-card>
				<div class="mouse-leave-fix top"></div>
				<div class="mouse-leave-fix right"></div>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsLeaderboardWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number, dpi: number) => 0;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number, dpi: number) => gameHeight * 0.15;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.bgs-leaderboard')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;
	bgsPlayers$: Observable<readonly BgsPlayer[]>;
	lastOpponentCardId$: Observable<string>;
	currentTurn$: Observable<number>;
	showLastOpponentIcon$: Observable<boolean>;
	windowWidth: number;
	windowHeight: number;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	ngAfterContentInit(): void {
		this.showWidget$ = combineLatest(
			this.store.listen$(([main, nav, prefs]) => main.currentScene),
			this.store.listenDeckState$((state) => state.metadata),
			this.store.listenPrefs$((prefs) => prefs.bgsEnableOpponentBoardMouseOver),
			this.store.listenBattlegrounds$(
				([state]) => state?.inGame,
				([state]) => state?.currentGame?.gameEnded,
				([state]) => state?.currentGame?.players?.length,
			),
		).pipe(
			this.mapData(
				([[currentScene], [metadata], [bgsEnableOpponentBoardMouseOver], [inGame, gameEnded, playerCount]]) =>
					isBattlegrounds(metadata.gameType) &&
					bgsEnableOpponentBoardMouseOver &&
					currentScene === SceneMode.GAMEPLAY &&
					inGame &&
					!gameEnded &&
					(GameType.GT_BATTLEGROUNDS_FRIENDLY === metadata.gameType ||
						(GameType.GT_BATTLEGROUNDS === metadata.gameType && playerCount === 8)),
			),
			this.handleReposition(),
		);
		this.bgsPlayers$ = this.store
			.listenBattlegrounds$(([state]) => state)
			.pipe(
				debounceTime(1000),
				filter(([state]) => !!state.currentGame),
				map(([state]) =>
					[...state.currentGame.players].sort(
						(a: BgsPlayer, b: BgsPlayer) => a.leaderboardPlace - b.leaderboardPlace,
					),
				),
				distinctUntilChanged((a, b) => areDeepEqual(a, b)),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting bgsPlayers in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.lastOpponentCardId$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame)
			.pipe(
				filter(([currentGame]) => !!currentGame),
				map(([currentGame]) => currentGame.lastOpponentCardId),
				distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting lastOpponentCardId 2 in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.currentTurn$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame)
			.pipe(
				filter(([currentGame]) => !!currentGame),
				map(([currentGame]) => currentGame.currentTurn),
				distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting currentTurn in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.showLastOpponentIcon$ = this.store
			.listen$(([state, nav, prefs]) => prefs.bgsShowLastOpponentIconInOverlay)
			.pipe(
				map(([bgsShowLastOpponentIconInOverlay]) => bgsShowLastOpponentIconInOverlay),
				distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting showLastOpponentIcon in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
	}

	trackByFunction(index: number, player: BgsPlayer) {
		return player.cardId;
	}

	protected async doResize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.height;
		this.windowWidth = gameHeight * 1.12;
		this.windowHeight = gameHeight * 0.4;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
