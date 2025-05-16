import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { isBattlegrounds, SceneMode } from '@firestone-hs/reference-data';
import { GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { auditTime, combineLatest, Observable } from 'rxjs';
import { AdService } from '../../../services/ad.service';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';

@Component({
	selector: 'bgs-hero-tips-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<bgs-hero-tips
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></bgs-hero-tips>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroTipsWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => (2 * gameWidth) / 3;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 200;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateBgsHeroTipsPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.bgsHeroTipsWidgetPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly ads: AdService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.ads, this.gameState, this.prefs);

		this.showWidget$ = combineLatest([
			this.ads.enablePremiumFeatures$$,
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsShowHeroTipsOverlay && prefs.bgsFullToggle)),
			this.gameState.gameState$$.pipe(
				auditTime(1000),
				this.mapData(
					(state) =>
						state.gameStarted &&
						!state.gameEnded &&
						isBattlegrounds(state.metadata?.gameType) &&
						!!state.bgState.currentGame?.getMainPlayer()?.cardId,
				),
			),
		]).pipe(
			this.mapData(([premium, currentScene, displayFromPrefs, inGame]) => {
				return premium && inGame && displayFromPrefs && currentScene === SceneMode.GAMEPLAY;
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
