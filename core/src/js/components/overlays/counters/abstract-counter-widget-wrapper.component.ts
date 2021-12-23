import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { GameState } from '../../../models/decktracker/game-state';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../../services/overwolf.service';
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
	side: string;

	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) =>
		gameWidth * 0.5 + 150 + Math.random() * 150;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) =>
		this.side === 'player' ? gameHeight * 0.65 : gameHeight * 0.1;
	protected positionUpdater = (left: number, top: number) =>
		this.prefs.updateCounterPosition(this.activeCounter, this.side, left, top);
	protected positionExtractor = (prefs: Preferences, prefService: PreferencesService) =>
		prefService.getCounterPosition(this.activeCounter, this.side);
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

	protected prefExtractor: (prefs: Preferences) => boolean;
	protected deckStateExtractor: (deckState: GameState) => boolean;
	protected isWidgetVisible = () => this.visible;

	private visible: boolean;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	ngAfterContentInit(): void {
		// console.debug('store', this.store);
		const displayFromGameModeSubject: BehaviorSubject<boolean> = this.ow.getMainWindow().decktrackerDisplayEventBus;
		const displayFromGameMode$ = displayFromGameModeSubject.asObservable();
		this.showWidget$ = combineLatest(
			this.store.listen$(
				([main, nav, prefs]) => main.currentScene,
				// Show from prefs
				([main, nav, prefs]) => (this.prefExtractor ? this.prefExtractor(prefs) : true),
			),
			this.store.listenDeckState$(
				(deckState) => deckState?.gameStarted,
				(deckState) => deckState?.gameEnded,
				(deckState) => deckState?.isBattlegrounds(),
				(deckState) => deckState?.isMercenaries(),
				(deckState) => (this.deckStateExtractor ? this.deckStateExtractor(deckState) : true),
			),
			displayFromGameMode$,
		).pipe(
			// tap((info) => console.debug('info', info)),
			this.mapData(
				([
					[currentScene, displayFromPrefs],
					[gameStarted, gameEnded, isBgs, isMercs, displayFromState],
					displayFromGameMode,
				]) => {
					if (
						!gameStarted ||
						isBgs ||
						isMercs ||
						!displayFromGameMode ||
						!displayFromPrefs ||
						!displayFromState
					) {
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
		);
		this.showWidget$.pipe(distinctUntilChanged(), takeUntil(this.destroyed$)).subscribe((show) => {
			this.visible = show;
			this.reposition();
		});
	}
}
