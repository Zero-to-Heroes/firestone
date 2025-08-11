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
import { GameNativeStateStoreService } from '@firestone/app/services';
import { GameStateFacadeService, OverlayDisplayService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, Observable } from 'rxjs';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'decktracker-opponent-widget-wrapper',
	styleUrls: [
		'../../../css/component/overlays/foreground-widget.component.scss',
		'../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss',
	],
	template: `
		<decktracker-overlay-opponent
			*ngIf="showWidget$ | async"
			class="widget"
			[ngClass]="{ hidden: hidden$ | async }"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></decktracker-overlay-opponent>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerOpponentWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => 0;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 50;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateOpponentTrackerPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.opponentOverlayPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = {
		left: -100,
		right: -100,
		top: -50,
		bottom: -50,
	};

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
		private readonly gameNativeStore: GameNativeStateStoreService,
		private readonly overlayDisplay: OverlayDisplayService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.gameNativeStore, this.overlayDisplay);

		const displayFromGameMode$ = this.overlayDisplay.decktrackerDisplayEventBus$$;
		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					displayFromPrefs: prefs.opponentTracker,
					decktrackerCloseOnGameEnd: prefs.decktrackerCloseOnGameEnd,
				})),
				distinctUntilChanged(
					(a, b) =>
						a.displayFromPrefs === b.displayFromPrefs &&
						a.decktrackerCloseOnGameEnd === b.decktrackerCloseOnGameEnd,
				),
			),
			this.gameState.gameState$$.pipe(
				this.mapData((state) => ({
					closedByUser: state?.opponentTrackerClosedByUser,
					gameStarted: state?.gameStarted,
					gameEnded: state?.gameEnded,
					isBgs: isBattlegrounds(state?.metadata?.gameType),
					isMercs: isMercenaries(state?.metadata?.gameType),
					totalCardsInZones: state?.opponentDeck?.totalCardsInZones(),
				})),
			),
			displayFromGameMode$,
		]).pipe(
			this.mapData(
				([
					currentScene,
					{ displayFromPrefs, decktrackerCloseOnGameEnd },
					{ closedByUser, gameStarted, gameEnded, isBgs, isMercs, totalCardsInZones },
					displayFromGameMode,
				]) => {
					if (closedByUser || !gameStarted || isBgs || isMercs || !displayFromGameMode || !displayFromPrefs) {
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

					return !gameEnded && totalCardsInZones > 0;
				},
			),
			this.handleReposition(),
		);
		this.hidden$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.hideOpponentDecktrackerWhenFriendsListIsOpen)),
			this.gameNativeStore.isFriendsListOpen$$,
		]).pipe(
			this.mapData(
				([hideOpponentDecktrackerWhenFriendsListIsOpen, isFriendsListOpen]) =>
					hideOpponentDecktrackerWhenFriendsListIsOpen && isFriendsListOpen,
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
