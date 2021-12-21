import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { combineLatest, Observable } from 'rxjs';
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'bgs-banned-tribes-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<bgs-banned-tribes
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
		></bgs-banned-tribes>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBannedTribesWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth / 2 + 300;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 200;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateBgsBannedTribedPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.bgsBannedTribesWidgetPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

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
	}

	ngAfterContentInit(): void {
		this.showWidget$ = combineLatest(
			this.store.listen$(
				([main, nav, prefs]) => main.currentScene,
				// Show from prefs
				([main, nav, prefs]) => prefs.bgsShowBannedTribesOverlay && prefs.bgsFullToggle,
			),
			this.store.listenBattlegrounds$(
				([state, prefs]) => state?.inGame,
				([state, prefs]) => !!state?.currentGame,
				([state, prefs]) => state?.currentGame?.gameEnded,
			),
		).pipe(
			// tap((info) => console.debug('info', info)),
			this.mapData(([[currentScene, displayFromPrefs], [inGame, isCurrentGame, gameEnded]]) => {
				return inGame && isCurrentGame && !gameEnded && displayFromPrefs && currentScene === SceneMode.GAMEPLAY;
			}),
		);
	}
}
