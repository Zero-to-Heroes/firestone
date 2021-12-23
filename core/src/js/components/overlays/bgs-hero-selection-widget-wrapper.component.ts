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
import { combineLatest, Observable } from 'rxjs';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'bgs-hero-selection-widget-wrapper',
	styleUrls: [],
	template: `
		<bgs-hero-selection-overlay
			class="widget"
			*ngIf="showWidget$ | async"
			[style.width.px]="windowWidth"
			[style.height.px]="windowHeight"
		></bgs-hero-selection-overlay>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroSelectionWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number, dpi: number) => gameHeight * 0.15;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number, dpi: number) => gameHeight / 3;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;
	windowWidth: number;
	windowHeight: number;

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
				([main, nav, prefs]) => prefs.bgsShowHeroSelectionAchievements,
			),
			this.store.listenBattlegrounds$(
				([state, prefs]) => state?.inGame,
				([state, prefs]) => !!state?.currentGame,
				([state, prefs]) => state?.currentGame?.gameEnded,
				([state, prefs]) => state?.heroSelectionDone,
			),
		).pipe(
			// tap((info) => console.debug('info', info)),
			this.mapData(
				([[currentScene, displayFromPrefs], [inGame, isCurrentGame, gameEnded, heroSelectionDone]]) => {
					return (
						inGame &&
						isCurrentGame &&
						!gameEnded &&
						!heroSelectionDone &&
						displayFromPrefs &&
						currentScene === SceneMode.GAMEPLAY
					);
				},
			),
		);
	}

	protected async doResize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		console.debug('resizing window', gameInfo);
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.height;
		this.windowWidth = gameHeight * 1.12;
		this.windowHeight = gameHeight * 0.4;
		console.debug('new size', this.windowWidth, this.windowHeight);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
