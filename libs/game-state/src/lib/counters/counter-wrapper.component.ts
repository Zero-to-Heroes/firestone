import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Host,
	Input,
	OnDestroy,
	Optional,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { SceneService } from '@firestone/memory';
import { BooleanWithLimited, PreferencesService } from '@firestone/shared/common/service';
import { uuidShort } from '@firestone/shared/framework/common';
import { AppInjector, OverwolfService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { GameState } from '../models/game-state';
import { GameStateFacadeService } from '../services/game-state-facade.service';
import { CounterInstance } from './_counter-definition-v2';
import { CountersPositionerComponent } from './counters-positioner.component';
import { AbstractWidgetWrapperComponent } from './widget-wrapper.component';

@Component({
	selector: 'counter-wrapper',
	styleUrls: ['./counter-wrapper.component.scss'],
	template: `
		<generic-counter-v2
			class="widget"
			[attr.data-id]="counter.id + '-' + side"
			[side]="side"
			[counter]="counter"
			[ngClass]="{ hidden: hidden }"
			[style.opacity]="(opacity$ | async) ?? 1"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></generic-counter-v2>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit, OnDestroy {
	// showWidget$: Observable<boolean>;

	// @Output() positionChanged = new EventEmitter<{ left: number; top: number }>();

	@Input() side: 'player' | 'opponent';
	@Input() counter: CounterInstance<any>;
	@Input() hidden = true;

	opacity$: Observable<number | null>;

	protected deckStateExtractor: (
		deckState: GameState,
		displayFromPrefs?: BooleanWithLimited,
		bgsState?: BattlegroundsState,
	) => boolean;

	private scene: SceneService;

	private id = uuidShort();

	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) =>
		gameWidth * 0.5 + gameHeight * 0.3;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) =>
		this.side === 'player' ? gameHeight * 0.75 : gameHeight * 0.1;
	protected positionUpdater = async (left: number, top: number) =>
		this.parent.saveWidgetPosition(this, { left, top });
	// this.prefs.updateCounterPosition(this.counter.id, this.side, left, top);
	protected positionExtractor = () => this.parent.retrieveWidgetPosition(this);
	// this.prefs.getCounterPosition(this.counter.id, this.side);
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

	constructor(
		public override readonly el: ElementRef,
		protected override readonly ow: OverwolfService,
		protected override readonly prefs: PreferencesService,
		protected override readonly renderer: Renderer2,
		protected override readonly cdr: ChangeDetectorRef,
		private readonly gameState: GameStateFacadeService,
		@Optional() @Host() private readonly parent: CountersPositionerComponent, // Inject the parent
	) {
		super(cdr, ow, el, prefs, renderer);
		this.scene = AppInjector.get(SceneService);
	}

	async ngAfterContentInit() {
		this.parent.registerChild(this);

		this.opacity$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => (prefs.globalWidgetOpacity ?? 100) / 100),
		);
		// this.el.nativeElement.setAttribute('data-id', this.id);
		// await waitForReady(this.scene);

		// this.showWidget$ = combineLatest([
		// 	this.scene.currentScene$$,
		// 	this.gameState.gameState$$.pipe(
		// 		this.mapData((gameState) => ({
		// 			gameStarted: gameState?.gameStarted,
		// 			gameEnded: gameState?.gameEnded,
		// 		})),
		// 	),
		// ]).pipe(
		// 	this.mapData(([currentScene, { gameStarted, gameEnded }]) => {
		// 		if (!gameStarted) {
		// 			return false;
		// 		}

		// 		// We explicitely don't check for null, so that if the memory updates are broken
		// 		// we still somehow show the info
		// 		if (currentScene !== SceneMode.GAMEPLAY) {
		// 			return false;
		// 		}

		// 		return !gameEnded;
		// 	}),
		// 	distinctUntilChanged(),
		// 	// this.handleReposition(),
		// );
		// this.showWidget$.subscribe((showWidget) => {
		// 	if (!showWidget) {
		// 		this.parent.unregisterChild(this);
		// 	} else {
		// 		this.parent.registerChild(this);
		// 	}
		// });

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	override ngOnDestroy(): void {
		super.ngOnDestroy();
		this.parent.unregisterChild(this);
	}
}
