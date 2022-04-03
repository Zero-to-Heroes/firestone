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
import { tap } from 'rxjs/operators';
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'decktracker-player-widget-wrapper',
	styleUrls: [
		'../../../css/component/overlays/foreground-widget.component.scss',
		'../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss',
	],
	template: `
		<decktracker-overlay-player
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></decktracker-overlay-player>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerPlayerWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit {
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
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, el, prefs, renderer, store, cdr);
		this.debug = true;
	}

	ngAfterContentInit(): void {
		// console.debug('store', this.store);
		const displayFromGameModeSubject: BehaviorSubject<boolean> = this.ow.getMainWindow().decktrackerDisplayEventBus;
		const displayFromGameMode$ = displayFromGameModeSubject.asObservable();
		this.showWidget$ = combineLatest(
			this.store.listen$(
				([main, nav, pref]) => main.currentScene,
				// Show from prefs
				([main, nav, pref]) => true,
				([main, nav, pref]) => pref.decktrackerCloseOnGameEnd,
			),
			this.store.listenDeckState$(
				(deckState) => deckState?.playerTrackerClosedByUser,
				(deckState) => deckState?.gameStarted,
				(deckState) => deckState?.gameEnded,
				(deckState) => deckState?.isBattlegrounds(),
				(deckState) => deckState?.isMercenaries(),
				(deckState) => deckState?.playerDeck?.totalCardsInZones(),
			),
			displayFromGameMode$,
		).pipe(
			tap((info) => console.debug('should display player tracker', info)),
			this.mapData(
				([
					[currentScene, displayFromPrefs, decktrackerCloseOnGameEnd],
					[closedByUser, gameStarted, gameEnded, isBgs, isMercs, totalCardsInZones],
					displayFromGameMode,
				]) => {
					if (closedByUser || !gameStarted || isBgs || isMercs || !displayFromGameMode || !displayFromPrefs) {
						console.debug('should show?', false);
						return false;
					}

					if (!decktrackerCloseOnGameEnd) {
						console.debug('should show?', displayFromGameMode);
						return displayFromGameMode;
					}

					// We explicitely don't check for null, so that if the memory updates are broken
					// we still somehow show the info
					if (currentScene !== SceneMode.GAMEPLAY) {
						console.debug('should show?', false);
						return false;
					}

					const result = !gameEnded && totalCardsInZones > 0;
					console.debug('should show?', result);
					return result;
				},
			),
			this.handleReposition(),
		);
	}
}
