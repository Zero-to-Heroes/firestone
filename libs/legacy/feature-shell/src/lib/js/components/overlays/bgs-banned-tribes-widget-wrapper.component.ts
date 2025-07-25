import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { CardIds, isBattlegrounds, SceneMode } from '@firestone-hs/reference-data';
import { GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'bgs-banned-tribes-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<bgs-banned-tribes
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></bgs-banned-tribes>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBannedTribesWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth / 2 + 300;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 200;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateBgsBannedTribedPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.bgsBannedTribesWidgetPosition;
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
				this.mapData((prefs) => prefs.bgsShowBannedTribesOverlay && prefs.bgsFullToggle),
			),
			this.gameState.gameState$$.pipe(
				this.mapData(
					(state) => state.gameStarted && !state.gameEnded && isBattlegrounds(state.metadata?.gameType),
				),
			),
			this.gameState.gameState$$.pipe(this.mapData((state) => state.bgState.currentGame?.anomalies)),
		]).pipe(
			this.mapData(([currentScene, displayFromPrefs, inGame, anomalies]) => {
				return (
					inGame &&
					displayFromPrefs &&
					currentScene === SceneMode.GAMEPLAY &&
					!anomalies?.includes(CardIds.TavernSpecial_BG27_Anomaly_103)
				);
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
