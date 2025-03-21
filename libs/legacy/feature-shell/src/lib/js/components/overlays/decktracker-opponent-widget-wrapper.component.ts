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
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { deepEqual } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
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
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs);

		const displayFromGameModeSubject: BehaviorSubject<boolean> = this.ow.getMainWindow().decktrackerDisplayEventBus;
		const displayFromGameMode$ = displayFromGameModeSubject.asObservable();
		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(
				this.mapData(
					(prefs) => ({
						displayFromPrefs: prefs.opponentTracker,
						decktrackerCloseOnGameEnd: prefs.decktrackerCloseOnGameEnd,
					}),
					(a, b) => deepEqual(a, b),
				),
			),
			this.store.listenDeckState$(
				(deckState) => deckState?.opponentTrackerClosedByUser,
				(deckState) => deckState?.gameStarted,
				(deckState) => deckState?.gameEnded,
				(deckState) => deckState?.isBattlegrounds(),
				(deckState) => deckState?.isMercenaries(),
				(deckState) => deckState?.opponentDeck?.totalCardsInZones(),
			),
			displayFromGameMode$,
		]).pipe(
			this.mapData(
				([
					currentScene,
					{ displayFromPrefs, decktrackerCloseOnGameEnd },
					[closedByUser, gameStarted, gameEnded, isBgs, isMercs, totalCardsInZones],
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
			this.store.listenNativeGameState$((state) => state.isFriendsListOpen),
		]).pipe(
			this.mapData(
				([hideOpponentDecktrackerWhenFriendsListIsOpen, [isFriendsListOpen]]) =>
					hideOpponentDecktrackerWhenFriendsListIsOpen && isFriendsListOpen,
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
