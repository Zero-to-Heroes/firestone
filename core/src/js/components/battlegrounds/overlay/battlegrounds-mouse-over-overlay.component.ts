import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewEncapsulation
} from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DebugService } from '../../../services/debug.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
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
			<ul class="bgs-leaderboard" *ngIf="bgsPlayers$ | async as bgsPlayers">
				<bgs-leaderboard-empty-card
					class="opponent-overlay"
					*ngFor="let bgsPlayer of bgsPlayers; let i = index; trackBy: trackByFunction"
					[bgsPlayer]="bgsPlayer"
					[currentTurn]="currentTurn$ | async"
					[lastOpponentCardId]="lastOpponentCardId$ | async"
					[showLastOpponentIcon]="showLastOpponentIcon$ | async"
					position="global-top-left"
				>
				</bgs-leaderboard-empty-card>
				<div class="mouse-leave-fix top"></div>
				<div class="mouse-leave-fix right"></div>
			</ul>
			<div class="board-container top-board">
				<ul class="board" *ngIf="minions$ | async as minions">
					<bgs-tavern-minion
						class="tavern-minion"
						*ngFor="let minion of minions; let i = index; trackBy: trackByMinion"
						[minion]="minion"
						[showTribesHighlight]="showTribesHighlight$ | async"
						[highlightedTribes]="highlightedTribes$ | async"
						[highlightedMinions]="highlightedMinions$ | async"
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
	implements AfterViewInit, OnDestroy {
	inGame$: Observable<boolean>;
	bgsPlayers$: Observable<readonly BgsPlayer[]>;
	lastOpponentCardId$: Observable<string>;
	currentTurn$: Observable<number>;
	minions$: Observable<readonly DeckCard[]>;
	highlightedTribes$: Observable<readonly Race[]>;
	highlightedMinions$: Observable<readonly string[]>;
	showLastOpponentIcon$: Observable<boolean>;
	showTribesHighlight$: Observable<boolean>;

	windowId: string;

	private gameInfoUpdatedListener: (message: any) => void;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreFacadeService,
		private readonly init_DebugService: DebugService,
	) {
		super();
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.ow.setWindowPassthrough(this.windowId);

		this.inGame$ = this.store
			.listenBattlegrounds$(
				([state]) => state.inGame,
				([state]) => state.currentGame,
			)
			.pipe(
				filter(([inGame, currentGame]) => !!currentGame),
				map(([inGame, currentGame]) => inGame && !currentGame.gameEnded),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				takeUntil(this.destroyed$),
			);
		this.bgsPlayers$ = this.store
			.listenBattlegrounds$(([state]) => state)
			.pipe(
				filter(([state]) => !!state.currentGame),
				map(([state]) =>
					[...(state.currentGame.players ?? [])].sort(
						(a: BgsPlayer, b: BgsPlayer) => a.leaderboardPlace - b.leaderboardPlace,
					),
				),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				takeUntil(this.destroyed$),
			);
		this.lastOpponentCardId$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame)
			.pipe(
				filter(([currentGame]) => !!currentGame),
				map(([currentGame]) => currentGame.lastOpponentCardId),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				takeUntil(this.destroyed$),
			);
		this.currentTurn$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame)
			.pipe(
				filter(([currentGame]) => !!currentGame),
				map(([currentGame]) => currentGame.currentTurn),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				takeUntil(this.destroyed$),
			);
		this.minions$ = combineLatest(
			this.store.listenBattlegrounds$(([state]) => state.currentGame),
			this.store.listenDeckState$((state) => state?.opponentDeck?.board),
		).pipe(
			filter(([[currentGame], opponentBoard]) => !!currentGame && !!opponentBoard),
			map(([[currentGame], opponentBoard]) => (currentGame.phase === 'recruit' ? opponentBoard : [])),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			takeUntil(this.destroyed$),
		);
		this.highlightedTribes$ = this.store
			.listenBattlegrounds$(([state]) => state.highlightedTribes)
			.pipe(
				map(([highlightedTribes]) => highlightedTribes),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				takeUntil(this.destroyed$),
			);
		this.highlightedMinions$ = this.store
			.listenBattlegrounds$(([state]) => state.highlightedMinions)
			.pipe(
				map(([highlightedMinions]) => highlightedMinions),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				takeUntil(this.destroyed$),
			);
		this.showLastOpponentIcon$ = this.store
			.listen$(([state, nav, prefs]) => prefs.bgsShowLastOpponentIconInOverlay)
			.pipe(
				map(([bgsShowLastOpponentIconInOverlay]) => bgsShowLastOpponentIconInOverlay),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				takeUntil(this.destroyed$),
			);
		this.showTribesHighlight$ = this.store
			.listen$(([state, nav, prefs]) => prefs.bgsShowTribesHighlight)
			.pipe(
				map(([bgsShowTribesHighlight]) => bgsShowTribesHighlight),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				takeUntil(this.destroyed$),
			);

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

	trackByMinion(index: number, minion: DeckCard) {
		return minion.entityId;
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
