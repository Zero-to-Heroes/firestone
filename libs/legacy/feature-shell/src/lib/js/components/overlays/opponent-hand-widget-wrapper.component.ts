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
import { GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged } from 'rxjs';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'opponent-hand-widget-wrapper',
	styleUrls: [
		'../../../css/component/overlays/background-widget.component.scss',
		'./opponent-hand-widget-wrapper.component.scss',
	],
	template: `
		<opponent-hand-overlay
			class="widget"
			*ngIf="showWidget$ | async"
			[style.width.px]="windowWidth"
			[style.height.px]="windowHeight"
		></opponent-hand-overlay>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentHandWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => 0.5 * (gameWidth - gameHeight);
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 0;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;
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

		const currentScene$$ = this.scene.currentScene$$.pipe(
			// tap((scene) => console.log('[opponent-hand-widget-wrapper] current scene', scene)),
			this.mapData((scene) => scene),
		);
		const displayFromPrefs$$ = this.prefs.preferences$$.pipe(
			// tap((prefs) =>
			// 	console.log(
			// 		'[opponent-hand-widget-wrapper] display from prefs',
			// 		prefs.dectrackerShowOpponentGuess,
			// 		prefs.dectrackerShowOpponentTurnDraw,
			// 	),
			// ),
			this.mapData((prefs) => prefs.dectrackerShowOpponentGuess || prefs.dectrackerShowOpponentTurnDraw),
		);
		const gameState$$ = this.gameState.gameState$$.pipe(
			// tap((state) =>
			// 	console.log(
			// 		'[opponent-hand-widget-wrapper] game state',
			// 		state.gameStarted,
			// 		state.gameEnded,
			// 		state.isBattlegrounds(),
			// 		state.isMercenaries(),
			// 	),
			// ),
			this.mapData((state) => ({
				gameStarted: state.gameStarted,
				gameEnded: state.gameEnded,
				isBgs: state.isBattlegrounds(),
				isMercs: state.isMercenaries(),
			})),
			distinctUntilChanged(
				(a, b) =>
					a.gameStarted === b.gameStarted &&
					a.gameEnded === b.gameEnded &&
					a.isBgs === b.isBgs &&
					a.isMercs === b.isMercs,
			),
		);
		this.showWidget$ = combineLatest([currentScene$$, displayFromPrefs$$, gameState$$]).pipe(
			this.mapData(([currentScene, displayFromPrefs, { gameStarted, gameEnded, isBgs, isMercs }]) => {
				if (!gameStarted || isBgs || isMercs || !displayFromPrefs) {
					console.log(
						'[opponent-hand-widget-wrapper] not showing widget 1',
						gameStarted,
						isBgs,
						isMercs,
						displayFromPrefs,
					);
					return false;
				}

				// We explicitely don't check for null, so that if the memory updates are broken
				// we still somehow show the info
				if (currentScene !== SceneMode.GAMEPLAY) {
					console.log('[opponent-hand-widget-wrapper] not showing widget 2', currentScene);
					return false;
				}

				console.log('[opponent-hand-widget-wrapper] showing widget?', gameEnded);
				return !gameEnded;
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	protected async doResize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.height;
		this.windowWidth = gameHeight;
		this.windowHeight = gameHeight * 0.1;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
