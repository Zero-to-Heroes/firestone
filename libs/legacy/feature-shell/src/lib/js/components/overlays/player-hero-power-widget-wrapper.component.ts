import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { isBattlegrounds, isMercenaries, SceneMode } from '@firestone-hs/reference-data';
import { DeckCard, GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'player-hero-power-widget-wrapper',
	styleUrls: [
		'../../../css/component/overlays/hero-power-widget-wrapper.component.scss',
		'../../../css/component/overlays/player-hero-power-widget-wrapper.component.scss',
	],
	template: `
		<div class="hero-power-container" *ngIf="showWidget$ | async">
			<hero-power-overlay [heroPower]="heroPower$ | async" [side]="'player'"></hero-power-overlay>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerHeroPowerWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = null;
	protected defaultPositionTopProvider = null;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = null;

	showWidget$: Observable<boolean>;
	heroPower$: Observable<DeckCard>;

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
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.gameState);

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.overlayHighlightRelatedCards)),
			this.gameState.gameState$$.pipe(this.mapData((state) => state.gameStarted)),
			this.gameState.gameState$$.pipe(this.mapData((state) => state.gameEnded)),
			this.gameState.gameState$$.pipe(this.mapData((state) => isBattlegrounds(state?.metadata?.gameType))),
			this.gameState.gameState$$.pipe(this.mapData((state) => isMercenaries(state?.metadata?.gameType))),
		]).pipe(
			this.mapData(([currentScene, displayFromPrefs, gameStarted, gameEnded, isBgs, isMercs]) => {
				if (!gameStarted || isBgs || isMercs || !displayFromPrefs) {
					return false;
				}

				// We explicitely don't check for null, so that if the memory updates are broken
				// we still somehow show the info
				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}

				return !gameEnded;
			}),
			this.handleReposition(),
		);

		this.heroPower$ = this.gameState.gameState$$.pipe(this.mapData((state) => state.playerDeck?.heroPower));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
