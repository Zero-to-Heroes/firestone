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
import { BgsStateFacadeService } from '@firestone/battlegrounds/common';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { deepEqual } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'bgs-hero-selection-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/bgs-hero-selection-widget-wrapper.component.scss'],
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
	protected defaultPositionLeftProvider = null;
	protected defaultPositionTopProvider = null;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = null;

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
		private readonly scene: SceneService,
		private readonly bgState: BgsStateFacadeService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.bgState);

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsShowHeroSelectionAchievements)),
			this.bgState.gameState$$.pipe(
				this.mapData(
					(state) => ({
						inGame: state?.inGame,
						isCurrentGame: !!state?.currentGame,
						gameEnded: state?.currentGame?.gameEnded,
						heroSelectionDone: state?.heroSelectionDone,
					}),
					(a, b) => deepEqual(a, b),
				),
			),
		]).pipe(
			this.mapData(
				([currentScene, displayFromPrefs, { inGame, isCurrentGame, gameEnded, heroSelectionDone }]) => {
					return (
						// (inGame && isCurrentGame && currentScene === SceneMode.GAMEPLAY) ||
						inGame &&
						isCurrentGame &&
						!gameEnded &&
						!heroSelectionDone &&
						displayFromPrefs &&
						currentScene === SceneMode.GAMEPLAY
					);
				},
			),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
