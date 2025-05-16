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
import { BgsInGameHeroSelectionGuardianService } from '@firestone/battlegrounds/common';
import { GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, pairwise, shareReplay, takeUntil } from 'rxjs';
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
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly gameState: GameStateFacadeService,
		private readonly guardian: BgsInGameHeroSelectionGuardianService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.gameState);

		const prefs$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => ({
				showAchievement: prefs.bgsShowHeroSelectionAchievements,
				showStats: prefs.bgsShowHeroSelectionTiers,
			})),
			distinctUntilChanged((a, b) => a?.showAchievement === b?.showAchievement && a?.showStats === b?.showStats),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			prefs$,
			this.gameState.gameState$$.pipe(
				this.mapData((state) => ({
					inGame: state.gameStarted && !state.gameEnded && !!state.bgState.currentGame,
					heroSelectionDone: state.bgState.heroSelectionDone,
				})),
				distinctUntilChanged(
					(a, b) => a?.inGame === b?.inGame && a?.heroSelectionDone === b?.heroSelectionDone,
				),
			),
		]).pipe(
			this.mapData(([currentScene, { showAchievement, showStats }, { inGame, heroSelectionDone }]) => {
				return (
					// (inGame && isCurrentGame && currentScene === SceneMode.GAMEPLAY) ||
					inGame &&
					!heroSelectionDone &&
					(showAchievement || showStats) &&
					currentScene === SceneMode.GAMEPLAY
				);
			}),
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
