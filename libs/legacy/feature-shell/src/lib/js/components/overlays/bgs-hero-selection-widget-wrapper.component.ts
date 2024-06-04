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
import { BgsInGameHeroSelectionGuardianService, BgsStateFacadeService } from '@firestone/battlegrounds/common';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { deepEqual } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, pairwise, shareReplay, takeUntil } from 'rxjs';
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
		private readonly guardian: BgsInGameHeroSelectionGuardianService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.bgState);

		const prefs$ = this.prefs.preferences$$.pipe(
			this.mapData(
				(prefs) => ({
					showAchievement: prefs.bgsShowHeroSelectionAchievements,
					showStats: prefs.bgsShowHeroSelectionTiers,
				}),
				(a, b) => deepEqual(a, b),
			),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			prefs$,
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
				([
					currentScene,
					{ showAchievement, showStats },
					{ inGame, isCurrentGame, gameEnded, heroSelectionDone },
				]) => {
					return (
						// (inGame && isCurrentGame && currentScene === SceneMode.GAMEPLAY) ||
						inGame &&
						isCurrentGame &&
						!gameEnded &&
						!heroSelectionDone &&
						(showAchievement || showStats) &&
						currentScene === SceneMode.GAMEPLAY
					);
				},
			),
			this.handleReposition(),
		);

		const displayInfo$ = combineLatest([this.showWidget$, prefs$]).pipe(
			this.mapData(
				([showWidget, { showAchievement, showStats }]) => showWidget && (showAchievement || showStats),
			),
		);
		displayInfo$
			.pipe(distinctUntilChanged(), pairwise(), takeUntil(this.destroyed$))
			.subscribe(([wasDisplayed, isDisplayed]) => {
				console.debug('[bgs-hero] widget visibility changed', wasDisplayed, isDisplayed);
				if (wasDisplayed && !isDisplayed) {
					this.guardian.acknowledgeStatsSeen();
				}
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
