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
import { AbstractWidgetWrapperComponent, GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { AccountService } from '@firestone/profile/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';

@Component({
	standalone: false,
	selector: 'bgs-action-count-widget-wrapper',
	styleUrls: [],
	template: `
		<bgs-action-count
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></bgs-action-count>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsActionCountWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => 50;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 50;
	protected positionUpdater = (left: number, top: number) =>
		this.prefs.updateWidgetPosition('bgsActionCountWidgetPosition', left, top);
	protected positionExtractor = async () => {
		const prefs = await this.prefs.getPreferences();
		return prefs.bgsActionCountWidgetPosition;
	};
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		protected override readonly ow: OverwolfService,
		protected override readonly el: ElementRef,
		protected override readonly prefs: PreferencesService,
		protected override readonly renderer: Renderer2,
		private readonly scene: SceneService,
		private readonly account: AccountService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(cdr, ow, el, prefs, renderer);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.gameState);

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActionCountEnabled)),
			this.gameState.gameState$$.pipe(
				this.mapData(
					(state) =>
						!!state?.gameStarted &&
						!state?.gameEnded &&
						!!state?.bgState.currentGame &&
						state.bgState.heroSelectionDone,
				),
			),
		]).pipe(
			this.mapData(([currentScene, displayFromPrefs, inGame]) => {
				console.log('[bgs-action-count] should show widget?', inGame, displayFromPrefs, currentScene);
				return inGame && displayFromPrefs && currentScene === SceneMode.GAMEPLAY;
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
