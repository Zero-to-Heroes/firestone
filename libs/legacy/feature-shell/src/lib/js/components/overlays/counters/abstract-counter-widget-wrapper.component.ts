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
import { AppInjector, OverwolfService, WindowManagerService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '@models/battlegrounds/battlegrounds-state';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged } from 'rxjs';
import { GameState } from '../../../models/decktracker/game-state';
import { BooleanWithLimited, Preferences } from '../../../models/preferences';
import { SceneService } from '../../../services/game/scene.service';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { CounterType } from '../../game-counters/definitions/_counter-definition';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';

export const templateBase = `
	<game-counters
		[side]="side"
		[activeCounter]="activeCounter"
		class="widget"
		*ngIf="showWidget$ | async"
		cdkDrag
		(cdkDragStarted)="startDragging()"
		(cdkDragReleased)="stopDragging()"
		(cdkDragEnded)="dragEnded($event)"
	></game-counters>
`;

@Component({
	selector: 'counter-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbstractCounterWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	showWidget$: Observable<boolean>;
	activeCounter: CounterType;
	side: 'player' | 'opponent';

	private defaultRandomLeft = Math.random();

	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) =>
		gameWidth * 0.5 + 150 + this.defaultRandomLeft * 150;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) =>
		this.side === 'player' ? gameHeight * 0.65 : gameHeight * 0.1;
	protected positionUpdater = (left: number, top: number) =>
		this.prefs.updateCounterPosition(this.activeCounter, this.side, left, top);
	protected positionExtractor = (prefs: Preferences, prefService: PreferencesService) =>
		prefService.getCounterPosition(this.activeCounter, this.side);
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

	protected prefExtractor: (prefs: Preferences) => BooleanWithLimited;
	protected deckStateExtractor: (
		deckState: GameState,
		displayFromPrefs?: BooleanWithLimited,
		bgsState?: BattlegroundsState,
	) => boolean;

	protected onBgs: boolean;

	private scene: SceneService;
	private windowManager: WindowManagerService;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, el, prefs, renderer, store, cdr);
		this.scene = AppInjector.get(SceneService);
		this.windowManager = AppInjector.get(WindowManagerService);
	}

	async ngAfterContentInit() {
		await this.scene.isReady();

		const mainWindow = await this.windowManager.getMainWindow();
		const displayFromGameModeSubject: BehaviorSubject<boolean> = mainWindow.decktrackerDisplayEventBus;
		const displayFromGameMode$ = displayFromGameModeSubject.asObservable();
		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.store.listen$(([main, nav, prefs]) => (this.prefExtractor ? this.prefExtractor(prefs) : true)),
			this.store.listenDeckState$(
				(deckState) => deckState?.gameStarted,
				(deckState) => deckState?.gameEnded,
				(deckState) => deckState?.isBattlegrounds(),
				(deckState) => deckState?.isMercenaries(),
				(deckState) => deckState,
			),
			this.store.listenBattlegrounds$(([gameState]) => gameState),
			displayFromGameMode$,
		]).pipe(
			this.mapData(
				([
					currentScene,
					[displayFromPrefs],
					[gameStarted, gameEnded, isBgs, isMercs, deckState],
					[bgState],
					displayFromGameMode,
				]) => {
					const displayFromState = this.deckStateExtractor
						? this.deckStateExtractor(deckState, displayFromPrefs, bgState)
						: true;
					if (
						!gameStarted ||
						(this.onBgs && !isBgs) ||
						(!this.onBgs && isBgs) ||
						isMercs ||
						(!this.onBgs && !displayFromGameMode) ||
						!displayFromPrefs ||
						!displayFromState
					) {
						return false;
					}

					// We explicitely don't check for null, so that if the memory updates are broken
					// we still somehow show the info
					if (currentScene !== SceneMode.GAMEPLAY) {
						return false;
						1;
					}

					return !gameEnded;
				},
			),
			distinctUntilChanged(),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
