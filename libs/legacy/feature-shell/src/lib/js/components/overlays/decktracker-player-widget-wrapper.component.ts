import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { isBattlegrounds, isMercenaries, SceneMode } from '@firestone-hs/reference-data';
import { GameStateFacadeService, OverlayDisplayService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, Observable, takeUntil, tap } from 'rxjs';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'decktracker-player-widget-wrapper',
	styleUrls: [
		'../../../css/component/overlays/foreground-widget.component.scss',
		'../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss',
	],
	template: `
		<decktracker-overlay-player
			tabindex="0"
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></decktracker-overlay-player>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerPlayerWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 250;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 10;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateTrackerPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.decktrackerPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = {
		left: -100,
		right: -100,
		top: -50,
		bottom: -50,
	};

	showWidget$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly overlayDisplay: OverlayDisplayService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.scene);

		this.gameState.gameState$$
			.pipe(
				tap((state) => console.debug('[decktracker-player-widget-wrapper] game state', state)),
				takeUntil(this.destroyed$),
			)
			.subscribe();

		const displayFromGameMode$ = this.overlayDisplay.decktrackerDisplayEventBus$$;
		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(this.mapData((pref) => pref.decktrackerCloseOnGameEnd)),
			this.gameState.gameState$$.pipe(
				this.mapData((deckState) => ({
					closedByUser: deckState?.playerTrackerClosedByUser,
					gameStarted: deckState?.gameStarted,
					gameEnded: deckState?.gameEnded,
					isBgs: isBattlegrounds(deckState?.metadata?.gameType),
					isMercs: isMercenaries(deckState?.metadata?.gameType),
					totalCardsInZones: deckState?.playerDeck?.totalCardsInZones() ?? 0,
				})),
				distinctUntilChanged(
					(a, b) =>
						a.closedByUser === b.closedByUser &&
						a.gameStarted === b.gameStarted &&
						a.gameEnded === b.gameEnded &&
						a.isBgs === b.isBgs &&
						a.isMercs === b.isMercs &&
						a.totalCardsInZones === b.totalCardsInZones,
				),
				takeUntil(this.destroyed$),
			),
			displayFromGameMode$,
		]).pipe(
			tap((info) => console.log('decktracker-player-widget-wrapper show widget?', info)),
			this.mapData(
				([
					currentScene,
					decktrackerCloseOnGameEnd,
					{ closedByUser, gameStarted, gameEnded, isBgs, isMercs, totalCardsInZones },
					displayFromGameMode,
				]) => {
					if (closedByUser || !gameStarted || isBgs || isMercs || !displayFromGameMode) {
						return false;
					}

					if (!decktrackerCloseOnGameEnd) {
						return displayFromGameMode;
					}

					// We explicitely don't check for null, so that if the memory updates are broken
					// we still somehow show the info
					if (currentScene !== SceneMode.GAMEPLAY) {
						return false;
					}

					const result = !gameEnded && totalCardsInZones > 0;
					return result;
				},
			),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
