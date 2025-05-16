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
import { GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { auditTime, combineLatest, Observable } from 'rxjs';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'bgs-window-button-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<battlegrounds-overlay-button
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></battlegrounds-overlay-button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsWindowButtonWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => 10;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 10;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateBgsOverlayButtonPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.bgsOverlayButtonPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;

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
		await waitForReady(this.scene, this.gameState);

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(
				this.mapData(
					(prefs) =>
						prefs.bgsFullToggle && prefs.bgsEnableApp && prefs.bgsUseOverlay && prefs.bgsShowOverlayButton,
				),
			),
			this.gameState.gameState$$.pipe(
				auditTime(1000),
				this.mapData(
					(state) => state.gameStarted && !state.gameEnded && isBattlegrounds(state.metadata?.gameType),
				),
			),
		]).pipe(
			this.mapData(([currentScene, displayFromPrefs, inGame]) => {
				return inGame && displayFromPrefs && currentScene === SceneMode.GAMEPLAY;
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
