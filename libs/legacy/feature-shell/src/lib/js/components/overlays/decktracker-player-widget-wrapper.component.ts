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
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
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
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await this.scene.isReady();

		const displayFromGameModeSubject: BehaviorSubject<boolean> = this.ow.getMainWindow().decktrackerDisplayEventBus;
		const displayFromGameMode$ = displayFromGameModeSubject.asObservable();
		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.store.listen$(
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
		]).pipe(
			this.mapData(
				([
					currentScene,
					[displayFromPrefs, decktrackerCloseOnGameEnd],
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

					const result = !gameEnded && totalCardsInZones > 0;
					return result;
				},
			),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
