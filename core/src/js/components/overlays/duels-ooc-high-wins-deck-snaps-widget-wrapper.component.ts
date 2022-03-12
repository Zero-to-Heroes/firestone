// import {
// 	AfterContentInit,
// 	ChangeDetectionStrategy,
// 	ChangeDetectorRef,
// 	Component,
// 	ElementRef,
// 	Renderer2,
// } from '@angular/core';
// import { combineLatest, Observable } from 'rxjs';
// import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
// import { Preferences } from '../../models/preferences';
// import { OverwolfService } from '../../services/overwolf.service';
// import { PreferencesService } from '../../services/preferences.service';
// import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
// import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

// @Component({
// 	selector: 'duels-ooc-high-wins-deck-snaps-widget-wrapper',
// 	styleUrls: [
// 		'../../../css/component/overlays/foreground-widget.component.scss',
// 		'../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
// 		'../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss',
// 	],
// 	template: `
// 		<duels-ooc-high-wins-deck-snaps
// 			class="widget"
// 			*ngIf="showWidget$ | async"
// 			cdkDrag
// 			(cdkDragStarted)="startDragging()"
// 			(cdkDragReleased)="stopDragging()"
// 			(cdkDragEnded)="dragEnded($event)"
// 		></duels-ooc-high-wins-deck-snaps>
// 	`,
// 	changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class DuelsDecktrackerOocWidgetWrapperComponent
// 	extends AbstractWidgetWrapperComponent
// 	implements AfterContentInit {
// 	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 250;
// 	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 10;
// 	protected positionUpdater = (left: number, top: number) =>
// 		this.prefs.updateDuelsOocHighWinsDecksSnapsPosition(left, top);
// 	protected positionExtractor = async (prefs: Preferences) => prefs.duelsOocHighWinsDecksSnapsPosition;
// 	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
// 	protected isWidgetVisible = () => this.visible;
// 	protected bounds = {
// 		left: -100,
// 		right: -100,
// 		top: -50,
// 		bottom: -50,
// 	};

// 	private visible: boolean;

// 	showWidget$: Observable<boolean>;

// 	constructor(
// 		protected readonly ow: OverwolfService,
// 		protected readonly el: ElementRef,
// 		protected readonly prefs: PreferencesService,
// 		protected readonly renderer: Renderer2,
// 		protected readonly store: AppUiStoreFacadeService,
// 		protected readonly cdr: ChangeDetectorRef,
// 	) {
// 		super(ow, el, prefs, renderer, store, cdr);
// 	}

// 	ngAfterContentInit(): void {
// 		this.showWidget$ = combineLatest(
// 			this.store.listenPrefs$((prefs) => prefs.duelsShowOocHighWinsDecksSnaps),
// 			this.store.listen$(([main, nav]) => main.duels.isOnDeckBuildingLobby),
// 		).pipe(
// 			this.mapData(([[displayFromPrefs], [isOnDeckBuildingLobby]]) => {
// 				return displayFromPrefs && isOnDeckBuildingLobby;
// 			}),
// 		);
// 		this.showWidget$.pipe(distinctUntilChanged(), takeUntil(this.destroyed$)).subscribe((show) => {
// 			this.visible = show;
// 			this.reposition();
// 		});
// 	}
// }
