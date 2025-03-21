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
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { CounterType, GameState } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { BooleanWithLimited, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AppInjector, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';

export const templateBase = `
	<game-counters
		[side]="side"
		[activeCounter]="activeCounter"
		class="widget"
		*ngIf="showWidget$ | async"
		cdkDrag
		[cdkDragDisabled]="!draggable"
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

	// It makes the widgets feel like they move around
	private defaultRandomLeft = 0; //Math.random();

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

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, el, prefs, renderer, cdr);
		this.scene = AppInjector.get(SceneService);
	}

	async ngAfterContentInit() {
		await this.scene.isReady();

		const displayFromGameModeSubject: BehaviorSubject<boolean> = this.ow.getMainWindow().decktrackerDisplayEventBus;
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
					if (
						!gameStarted ||
						(this.onBgs && !isBgs) ||
						(!this.onBgs && isBgs) ||
						isMercs ||
						(!this.onBgs && !displayFromGameMode) ||
						!displayFromPrefs
					) {
						return false;
					}

					const displayFromState = this.deckStateExtractor
						? this.deckStateExtractor(deckState, displayFromPrefs, bgState)
						: true;
					if (!displayFromState) {
						return false;
					}

					// We explicitely don't check for null, so that if the memory updates are broken
					// we still somehow show the info
					if (currentScene !== SceneMode.GAMEPLAY) {
						return false;
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
