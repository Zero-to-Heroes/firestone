import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { isBattlegrounds, SceneMode } from '@firestone-hs/reference-data';
import { BgsBoardHighlighterService, ShopMinion } from '@firestone/battlegrounds/common';
import { GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import {} from 'jszip';
import { auditTime, combineLatest, Observable } from 'rxjs';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'bgs-board-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/bgs-board-widget-wrapper.component.scss'],
	template: `
		<div class="board-container" *ngIf="showWidget$ | async">
			<ul class="board" *ngIf="highlightedMinions$ | async as highlightedMinions">
				<bgs-tavern-minion
					class="tavern-minion"
					*ngFor="let minion of highlightedMinions; trackBy: trackByMinion"
					[minion]="minion"
				></bgs-tavern-minion>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBoardWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = null;
	protected defaultPositionTopProvider = null;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = null;

	showWidget$: Observable<boolean>;
	highlightedMinions$: Observable<readonly ShopMinion[]>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly highlighter: BgsBoardHighlighterService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.highlighter, this.gameState);

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.gameState.gameState$$.pipe(
				auditTime(1000),
				this.mapData(
					(state) => state.gameStarted && !state.gameEnded && isBattlegrounds(state.metadata?.gameType),
				),
			),
		]).pipe(
			this.mapData(([currentScene, inGame]) => currentScene === SceneMode.GAMEPLAY && inGame),
			this.handleReposition(),
		);
		this.highlightedMinions$ = this.highlighter.shopMinions$$.pipe(
			this.mapData((highlightedMinion) => {
				return highlightedMinion;
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByMinion(index: number, minion: ShopMinion) {
		return minion.entityId;
	}
}
