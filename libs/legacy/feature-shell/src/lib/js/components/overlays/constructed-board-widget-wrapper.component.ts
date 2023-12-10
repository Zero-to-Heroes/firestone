import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { DeckCard, ShortCard } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { SceneService } from '../../services/game/scene.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';
import { BoardCardOverlay } from './board/board-card-overlay';

@Component({
	selector: 'constructed-board-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/constructed-board-widget-wrapper.component.scss'],
	template: `
		<ng-container *ngIf="{ board: board$ | async } as value">
			<div class="board-container" *ngIf="showWidget$ | async">
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
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await this.scene.isReady();

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.store.listen$(([main, nav, prefs]) => prefs.decktrackerShowMinionPlayOrderOnBoard),
			this.store.listenDeckState$(
				(deckState) => deckState?.gameStarted,
				(deckState) => deckState?.gameEnded,
				(deckState) => deckState?.isBattlegrounds(),
				(deckState) => deckState?.isMercenaries(),
			),
		]).pipe(
			this.mapData(([currentScene, [displayFromPrefs], [gameStarted, gameEnded, isBgs, isMercs]]) => {
				if (!gameStarted || isBgs || isMercs || !displayFromPrefs) {
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
		);

		this.board$ = this.store
			.listenDeckState$(
				(state) => state.opponentDeck?.board,
				(state) => state.playerDeck?.board,
			)
			.pipe(
				this.mapData(([opponentBoard, playerBoard]) => {
					const top = this.buildBoard(opponentBoard, 'opponent');
					const bottom = this.buildBoard(playerBoard, 'player');
					const allPlayIndices = [...top, ...bottom].map((c) => c.playOrder).sort((n1, n2) => n1 - n2);
					return {
						top: top.map((c) => ({ ...c, playOrder: 1 + allPlayIndices.indexOf(c.playOrder) })),
						bottom: bottom.map((c) => ({ ...c, playOrder: 1 + allPlayIndices.indexOf(c.playOrder) })),
					} as BoardOverlay;
				}),
			);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByMinion(index: number, minion: ShortCard) {
		return minion.entityId;
	}

	private buildBoard(playerBoard: readonly DeckCard[], side: 'player' | 'opponent'): readonly BoardCardOverlay[] {
		return playerBoard.map((playerCard) => ({
			cardId: playerCard.cardId,
			entityId: playerCard.entityId,
			side: side,
			playOrder: playerCard.playTiming,
		}));
	}
}

interface BoardOverlay {
	readonly top: readonly BoardCardOverlay[];
	readonly bottom: readonly BoardCardOverlay[];
}
