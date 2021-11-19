import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
} from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { DebugService } from '../../../services/debug.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { areDeepEqual, arraysEqual } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'battlegrounds-mouse-over-overlay',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		`../../../../css/themes/battlegrounds-theme.scss`,
		'../../../../css/component/battlegrounds/overlay/battlegrounds-mouse-over-overlay.component.scss',
	],
	template: `
		<div
			class="battlegrounds-mouse-over-overlay overlay-container-parent battlegrounds-theme"
			*ngIf="inGame$ | async"
		>
			<!-- So that we avoid showing other players infos before the start of the match -->
			<ul
				class="bgs-leaderboard"
				*ngIf="{
					bgsPlayers: bgsPlayers$ | async,
					currentTurn: currentTurn$ | async,
					lastOpponentCardId: lastOpponentCardId$ | async,
					showLastOpponentIcon: showLastOpponentIcon$ | async
				} as value"
			>
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
			</ul>
			<div
				class="board-container top-board"
				*ngIf="{
					showTribesHighlight: showTribesHighlight$ | async,
					highlightedTribes: highlightedTribes$ | async,
					highlightedMinions: highlightedMinions$ | async
				} as value"
			>
				<ul class="board" *ngIf="minionCardIds$ | async as minionCardIds">
					<bgs-tavern-minion
						class="tavern-minion"
						*ngFor="let minion of minionCardIds; trackBy: trackByMinion"
						[minion]="minion"
						[showTribesHighlight]="value.showTribesHighlight"
						[highlightedTribes]="value.highlightedTribes"
						[highlightedMinions]="value.highlightedMinions"
					></bgs-tavern-minion>
				</ul>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class BattlegroundsMouseOverOverlayComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit, OnDestroy {
	inGame$: Observable<boolean>;
	bgsPlayers$: Observable<readonly BgsPlayer[]>;
	lastOpponentCardId$: Observable<string>;
	currentTurn$: Observable<number>;
	minionCardIds$: Observable<readonly string[]>;
	highlightedTribes$: Observable<readonly Race[]>;
	highlightedMinions$: Observable<readonly string[]>;
	showLastOpponentIcon$: Observable<boolean>;
	showTribesHighlight$: Observable<boolean>;

	windowId: string;

	private gameInfoUpdatedListener: (message: any) => void;

	constructor(
		private readonly ow: OverwolfService,
		private readonly init_DebugService: DebugService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.inGame$ = this.store
			.listenBattlegrounds$(
				([state]) => state.inGame,
				([state]) => state.currentGame,
			)
			.pipe(
				filter(([inGame, currentGame]) => !!currentGame),
				map(([inGame, currentGame]) => inGame && !currentGame.gameEnded),
				distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting inGame in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.bgsPlayers$ = this.store
			.listenBattlegrounds$(([state]) => state)
			.pipe(
				debounceTime(1000),
				filter(([state]) => !!state.currentGame),
				map(([state]) =>
					[...(state.currentGame.players ?? [])].sort(
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
		this.minionCardIds$ = combineLatest(
			this.store.listenBattlegrounds$(([state]) => state.currentGame?.phase),
			this.store.listenDeckState$((state) => state?.opponentDeck?.board),
		).pipe(
			debounceTime(500),
			filter(([[phase], [opponentBoard]]) => !!phase && !!opponentBoard),
			map(([[phase], [opponentBoard]]) =>
				phase === 'recruit' ? opponentBoard.map((minion) => minion.cardId) : [],
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((info) => cdLog('emitting minions in ', this.constructor.name, info)),
			takeUntil(this.destroyed$),
		);
		this.highlightedTribes$ = this.store
			.listenBattlegrounds$(([state]) => state.highlightedTribes)
			.pipe(
				map(([highlightedTribes]) => highlightedTribes),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting highlightedTribes in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.highlightedMinions$ = this.store
			.listenBattlegrounds$(([state]) => state.highlightedMinions)
			.pipe(
				map(([highlightedMinions]) => highlightedMinions),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting highlightedMinions in ', this.constructor.name, info)),
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
		this.showTribesHighlight$ = this.store
			.listen$(([state, nav, prefs]) => prefs.bgsShowTribesHighlight)
			.pipe(
				map(([bgsShowTribesHighlight]) => bgsShowTribesHighlight),
				distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting showTribesHighlight in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.ow.setWindowPassthrough(this.windowId);

		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				await this.changeWindowSize();
			}
		});
		await this.changeWindowSize();
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
	}

	trackByFunction(index: number, player: BgsPlayer) {
		return player.cardId;
	}

	trackByMinion(index: number, minion: string) {
		return index;
	}

	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.width;
		const gameHeight = gameInfo.height;
		const height = gameHeight;
		const width = gameHeight * 1.4;
		await this.ow.changeWindowSize(this.windowId, width, height);
		const dpi = gameInfo.logicalWidth / gameWidth;
		const newLeft = dpi * 0.5 * (gameWidth - width);
		await this.ow.changeWindowPosition(this.windowId, newLeft, 0);
	}
}
