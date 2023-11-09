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
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { SceneService } from '../../services/game/scene.service';
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
	implements AfterContentInit
{
	// protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.92;
	// protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.86;
	protected defaultPositionLeftProvider = null;
	protected defaultPositionTopProvider = null;
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
		private readonly scene: SceneService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await this.scene.isReady();

		this.showWidget$ = combineLatest([
			this.store.listenPrefs$((prefs) => prefs.duelsShowOocDeckSelect),
			this.store.listen$(([main, nav]) => main.duels.isOnDuelsDeckBuildingLobbyScreen),
			this.scene.currentScene$$,
		]).pipe(
			this.mapData(([[displayFromPrefs], [isOnDeckBuildingLobby], currentScene]) => {
				return displayFromPrefs && isOnDeckBuildingLobby && currentScene === SceneMode.PVP_DUNGEON_RUN;
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
