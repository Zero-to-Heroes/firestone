import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { GameTag, isBattlegrounds, isMercenaries, SceneMode } from '@firestone-hs/reference-data';
import { DeckCard, GameStateFacadeService, ShortCard } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, Observable, shareReplay, takeUntil } from 'rxjs';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';
import { BoardCardOverlay } from './board/board-card-overlay';

@Component({
	standalone: false,
	selector: 'constructed-board-widget-wrapper',
	styleUrls: ['./constructed-board-widget-wrapper.component.scss'],
	template: `
		<ng-container *ngIf="{ board: board$ | async } as value">
			<div class="top-weapon" *ngIf="showWidget$ | async">
				<minion-on-board-overlay
					*ngIf="value.board.topWeapon"
					[playOrder]="value.board.topWeapon.playOrder"
					[attr.data-entity-id]="value.board.topWeapon.entityId"
					[attr.data-card-id]="value.board.topWeapon.cardId"
				></minion-on-board-overlay>
			</div>
			<div class="board-container" *ngIf="showWidget$ | async" [style.opacity]="opacity$ | async">
				<ul class="board top">
					<minion-on-board-overlay
						*ngFor="let card of value.board.top || []; trackBy: trackByMinion"
						[playOrder]="card.playOrder"
					></minion-on-board-overlay>
				</ul>
				<ul class="board bottom">
					<minion-on-board-overlay
						*ngFor="let card of value.board.bottom || []; trackBy: trackByMinion"
						[playOrder]="card.playOrder"
						[attr.data-entity-id]="card.entityId"
						[attr.data-card-id]="card.cardId"
					></minion-on-board-overlay>
				</ul>
			</div>
			<div class="bottom-weapon" *ngIf="showWidget$ | async">
				<minion-on-board-overlay
					*ngIf="value.board.bottomWeapon"
					[playOrder]="value.board.bottomWeapon.playOrder"
					[attr.data-entity-id]="value.board.bottomWeapon.entityId"
					[attr.data-card-id]="value.board.bottomWeapon.cardId"
				></minion-on-board-overlay>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedBoardWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = null;
	protected defaultPositionTopProvider = null;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.board-container')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;
	board$: Observable<BoardOverlay>;
	opacity$: Observable<number>;

	windowWidth: number;
	windowHeight: number;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.gameState);

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.decktrackerShowMinionPlayOrderOnBoard)),
			this.gameState.gameState$$.pipe(
				this.mapData((state) => ({
					gameStarted: state.gameStarted,
					gameEnded: state.gameEnded,
					isBgs: isBattlegrounds(state?.metadata?.gameType),
					isMercs: isMercenaries(state?.metadata?.gameType),
				})),
				distinctUntilChanged(
					(a, b) =>
						a.gameStarted === b.gameStarted &&
						a.gameEnded === b.gameEnded &&
						a.isBgs === b.isBgs &&
						a.isMercs === b.isMercs,
				),
			),
		]).pipe(
			this.mapData(([currentScene, displayFromPrefs, { gameStarted, gameEnded, isBgs, isMercs }]) => {
				if (!gameStarted || gameEnded || isBgs || isMercs || !displayFromPrefs) {
					return false;
				}

				// We explicitely don't check for null, so that if the memory updates are broken
				// we still somehow show the info
				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}

				return !gameEnded;
			}),
			this.handleReposition(),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.opacity$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => Math.max(0.01, prefs.decktrackerMinionPlayOrderOpacity / 100)),
		);

		this.board$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.decktrackerShowWeaponPlayOrderOnBoard)),
			this.gameState.gameState$$,
		]).pipe(
			this.mapData(([showWeapons, state]) => ({
				showWeapons,
				opponentWeapon: state.opponentDeck?.weapon,
				opponentBoard: state.opponentDeck?.board,
				playerBoard: state.playerDeck?.board,
				playerWeapon: state.playerDeck?.weapon,
			})),
			distinctUntilChanged(
				(a, b) =>
					a.showWeapons === b.showWeapons &&
					a.opponentBoard === b.opponentBoard &&
					a.playerBoard === b.playerBoard &&
					a.opponentWeapon === b.opponentWeapon &&
					a.playerWeapon === b.playerWeapon,
			),
			this.mapData(({ showWeapons, opponentBoard, playerBoard, opponentWeapon, playerWeapon }) => {
				const topWeapon =
					!showWeapons || !opponentWeapon
						? null
						: {
								cardId: opponentWeapon?.cardId,
								entityId: opponentWeapon?.entityId,
								playOrder: opponentWeapon?.playTiming,
								side: 'opponent',
							};
				const top = this.buildBoard(opponentBoard, 'opponent');
				const bottom = this.buildBoard(playerBoard, 'player');
				const bottomWeapon =
					!showWeapons || !playerWeapon
						? null
						: {
								cardId: playerWeapon?.cardId,
								entityId: playerWeapon?.entityId,
								playOrder: playerWeapon?.playTiming,
								side: 'player',
							};
				const allPlayIndices = [...top, ...bottom, topWeapon, bottomWeapon]
					.filter((c) => c !== null)
					.map((c) => c.playOrder)
					.sort((n1, n2) => n1 - n2);
				return {
					topWeapon: topWeapon
						? { ...topWeapon, playOrder: 1 + allPlayIndices.indexOf(topWeapon?.playOrder) }
						: null,
					top: top.map((c) => ({ ...c, playOrder: 1 + allPlayIndices.indexOf(c.playOrder) })),
					bottomWeapon: bottomWeapon
						? { ...bottomWeapon, playOrder: 1 + allPlayIndices.indexOf(bottomWeapon?.playOrder) }
						: null,
					bottom: bottom.map((c) => ({ ...c, playOrder: 1 + allPlayIndices.indexOf(c.playOrder) })),
				} as BoardOverlay;
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	trackByMinion(index: number, minion: ShortCard) {
		return minion.entityId;
	}

	private buildBoard(playerBoard: readonly DeckCard[], side: 'player' | 'opponent'): readonly BoardCardOverlay[] {
		return [...playerBoard]
			.sort((a, b) => (a.tags[GameTag.ZONE_POSITION] ?? 0) - (b.tags[GameTag.ZONE_POSITION] ?? 0))
			.map((playerCard) => ({
				cardId: playerCard.cardId,
				entityId: playerCard.entityId,
				side: side,
				playOrder: playerCard.playTiming,
			}));
	}
}

interface BoardOverlay {
	readonly topWeapon: BoardCardOverlay | null;
	readonly top: readonly BoardCardOverlay[];
	readonly bottomWeapon: BoardCardOverlay | null;
	readonly bottom: readonly BoardCardOverlay[];
}
