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
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'duels-ooc-deck-select-widget-wrapper',
	styleUrls: [
		'../../../css/component/overlays/foreground-widget.component.scss',
		'../../../css/component/overlays/duels-ooc-deck-select-widget-wrapper.component.scss',
	],
	template: ` <duels-ooc-deck-select class="widget" *ngIf="showWidget$ | async"></duels-ooc-deck-select> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsOocDeckSelectWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.92;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.58;
	protected positionUpdater = null;
	protected positionExtractor = null;
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
			this.store.listenPrefs$((prefs) => prefs.duelsShowOocDeckSelect),
			this.store.listen$(
				([main, nav]) => main.duels.isOnDuelsDeckBuildingLobbyScreen,
				([main, nav]) => main.currentScene,
			),
		).pipe(
			this.mapData(([[displayFromPrefs], [isOnDeckBuildingLobby, currentScene]]) => {
				return displayFromPrefs && isOnDeckBuildingLobby && currentScene === SceneMode.PVP_DUNGEON_RUN;
			}),
			this.handleReposition(),
		);
	}
}
