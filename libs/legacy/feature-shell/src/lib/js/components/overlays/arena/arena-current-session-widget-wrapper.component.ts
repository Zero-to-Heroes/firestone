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
import { AbstractWidgetWrapperComponent, GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, filter, Observable, switchMap, takeUntil } from 'rxjs';

const refBounds = {
	left: -50,
	right: -50,
	top: -50,
	bottom: -50,
};

@Component({
	selector: 'arena-current-session-widget-wrapper',
	styleUrls: ['./arena-current-session-widget-wrapper.component.scss'],
	template: `
		<div
			class="wrapper"
			[ngClass]="{ hidden: hidden$ | async }"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		>
			<arena-current-session-widget
				*ngIf="showWidget$ | async"
				class="widget scalable"
				[ngClass]="{ hidden: hidden$ | async }"
			></arena-current-session-widget>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCurrentSessionWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 500;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 10;
	protected positionUpdater = (left: number, top: number) =>
		this.prefs.updatePrefs('arenaCurrentSessionWidgetPosition', { left, top });
	protected positionExtractor = async () => (await this.prefs.getPreferences()).arenaCurrentSessionWidgetPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = refBounds;

	showWidget$: Observable<boolean>;
	hidden$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(cdr, ow, el, prefs, renderer);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.gameState);

		const currentGameType$ = this.gameState.gameState$$.pipe(this.mapData((state) => state?.metadata?.gameType));
		this.showWidget$ = combineLatest([currentGameType$, this.scene.currentScene$$, this.prefs.preferences$$]).pipe(
			this.mapData(
				([gameType, currentScene, prefs]) =>
					prefs.arenaShowCurrentSessionWidget &&
					(isArenaScene(currentScene) ||
						(prefs.arenaShowCurrentSessionWidgetInGame && gameType === GameType.GT_ARENA)),
			),
			this.handleReposition(),
		);
		// this.hidden$ = combineLatest([
		// 	this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.hideCurrentSessionWidgetWhenFriendsListIsOpen)),
		// 	this.store.listenNativeGameState$((state) => state.isFriendsListOpen),
		// ]).pipe(
		// 	this.mapData(
		// 		([hideCurrentSessionWidgetWhenFriendsListIsOpen, [isFriendsListOpen]]) =>
		// 			hideCurrentSessionWidgetWhenFriendsListIsOpen && isFriendsListOpen,
		// 	),
		// );

		this.showWidget$
			.pipe(
				filter((show) => show),
				switchMap(() =>
					combineLatest([
						this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
						this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaSessionWidgetScale ?? 100)),
					]),
				),
				takeUntil(this.destroyed$),
			)
			.subscribe(([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				const element = this.el.nativeElement.querySelector('.scalable');
				if (element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				}

				const boundsScale = 1 / newScale;
				this.bounds = {
					left: refBounds.left * boundsScale,
					right: refBounds.right * boundsScale,
					top: refBounds.top * boundsScale,
					bottom: refBounds.bottom * boundsScale,
				};
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

const isArenaScene = (scene: SceneMode): boolean => {
	return scene === SceneMode.DRAFT;
};
