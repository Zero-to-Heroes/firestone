import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { SceneService } from '@firestone/memory';
import { BooleanWithLimited, PreferencesService } from '@firestone/shared/common/service';
import { AppInjector, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged } from 'rxjs';
import { GameState } from '../models/game-state';
import { GameStateFacadeService } from '../services/game-state-facade.service';
import { CounterInstance } from './_counter-definition-v2';
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
			*ngIf="showWidget$ | async"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></generic-counter-v2>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	showWidget$: Observable<boolean>;

	@Input() side: 'player' | 'opponent';
	@Input() counter: CounterInstance<any>;

	protected deckStateExtractor: (
		deckState: GameState,
		displayFromPrefs?: BooleanWithLimited,
		bgsState?: BattlegroundsState,
	) => boolean;

	private scene: SceneService;

	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) =>
		gameWidth * 0.5 + gameHeight * 0.3;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) =>
		this.side === 'player' ? gameHeight * 0.75 : gameHeight * 0.1;
	protected positionUpdater = (left: number, top: number) =>
		this.prefs.updateCounterPosition(this.counter.id, this.side, left, top);
	protected positionExtractor = () => this.prefs.getCounterPosition(this.counter.id, this.side);
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

	constructor(
		protected override readonly ow: OverwolfService,
		protected override readonly el: ElementRef,
		protected override readonly prefs: PreferencesService,
		protected override readonly renderer: Renderer2,
		protected override readonly cdr: ChangeDetectorRef,
		private readonly gameState: GameStateFacadeService,
	) {
		super(cdr, ow, el, prefs, renderer);
		this.scene = AppInjector.get(SceneService);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene);

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.gameState.gameState$$.pipe(
				this.mapData((gameState) => ({
					gameStarted: gameState?.gameStarted,
					gameEnded: gameState?.gameEnded,
				})),
			),
		]).pipe(
			this.mapData(([currentScene, { gameStarted, gameEnded }]) => {
				if (!gameStarted) {
					return false;
				}

				// We explicitely don't check for null, so that if the memory updates are broken
				// we still somehow show the info
				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}

				return !gameEnded;
			}),
			distinctUntilChanged(),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
