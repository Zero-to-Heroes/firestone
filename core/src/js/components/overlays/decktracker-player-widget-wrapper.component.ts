import {
	AfterContentInit,
	AfterViewInit,
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
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'decktracker-player-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<decktracker-overlay-player
			class="widget"
			*ngIf="showPlayerDecktracker$ | async"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
		></decktracker-overlay-player>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerPlayerWidgetWrapperComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	defaultTrackerPositionLeftProvider = (gameWidth: number, windowWidth: number) => gameWidth - windowWidth / 2 - 180;
	defaultTrackerPositionTopProvider = (gameHeight: number, windowHeight: number) => 10;
	trackerPositionUpdater = (left: number, top: number) => this.prefs.updateTrackerPosition(left, top);
	trackerPositionExtractor = (prefs: Preferences) => prefs.decktrackerPosition;

	showPlayerDecktracker$: Observable<boolean>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly el: ElementRef,
		private readonly prefs: PreferencesService,
		private readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		console.debug('store', this.store);
		const displayFromGameModeSubject: BehaviorSubject<boolean> = this.ow.getMainWindow().decktrackerDisplayEventBus;
		const displayFromGameMode$ = displayFromGameModeSubject.asObservable();
		this.showPlayerDecktracker$ = combineLatest(
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
			tap((info) => console.debug('info', info)),
			this.mapData(
				([
					[currentScene, displayFromPrefs, decktrackerCloseOnGameEnd],
					[closedByUser, gameStarted, gameEnded, isBgs, isMercs, totalCardsInZones],
					displayFromGameMode,
				]) => {
					if (closedByUser || !gameStarted || isBgs || isMercs || !displayFromGameMode || !displayFromPrefs) {
						console.debug(closedByUser, gameStarted, isBgs, isMercs, displayFromGameMode, displayFromPrefs);
						return false;
					}

					if (!decktrackerCloseOnGameEnd) {
						console.debug(decktrackerCloseOnGameEnd, displayFromGameMode);
						return displayFromGameMode;
					}

					// We explicitely don't check for null, so that if the memory updates are broken
					// we still somehow show the info
					if (currentScene !== SceneMode.GAMEPLAY) {
						console.debug(currentScene);
						return false;
					}

					console.debug(gameEnded, totalCardsInZones);
					return !gameEnded && totalCardsInZones > 0;
				},
			),
		);
	}

	async ngAfterViewInit() {
		const prefs = await this.prefs.getPreferences();
		let positionFromPrefs = this.trackerPositionExtractor(prefs);
		console.debug('positionFromPrefs', positionFromPrefs);
		if (!positionFromPrefs) {
			const gameInfo = await this.ow.getRunningGameInfo();
			const gameWidth = gameInfo.width;
			const gameHeight = gameInfo.height;
			const height = gameHeight;
			const width = gameWidth;
			positionFromPrefs = {
				left: this.defaultTrackerPositionLeftProvider(width, height),
				top: this.defaultTrackerPositionTopProvider(width, height),
			};
			console.debug('built default position', positionFromPrefs);
		}
		this.renderer.setStyle(this.el.nativeElement, 'left', positionFromPrefs.left + 'px');
		this.renderer.setStyle(this.el.nativeElement, 'top', positionFromPrefs.top + 'px');
	}

	startDragging() {
		console.debug('start dragging', this.el.nativeElement);
	}

	stopDragging() {
		console.debug(
			'stopDragging',
			this.el.nativeElement.querySelector('.widget'),
			this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect(),
			getPosition(this.el.nativeElement.querySelector('.widget')),
		);
		const newPosition = {
			x: this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect().left,
			y: this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect().top,
		};
		console.debug('new position', newPosition);
		this.trackerPositionUpdater(newPosition.x, newPosition.y);
	}
}

const getPosition = (el) => {
	let offsetLeft = 0;
	let offsetTop = 0;

	while (el) {
		offsetLeft += el.offsetLeft;
		offsetTop += el.offsetTop;
		el = el.offsetParent;
	}
	return { offsetTop: offsetTop, offsetLeft: offsetLeft };
};
