import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { DeckCard } from '@models/decktracker/deck-card';
import { combineLatest, Observable } from 'rxjs';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
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
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number, dpi: number) => gameHeight * 0.8;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number, dpi: number) => gameHeight * 0.71;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.hero-power-container')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;
	heroPower$: Observable<DeckCard>;

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
				([main, nav, prefs]) => prefs.overlayHighlightRelatedCards,
			),
			this.store.listenDeckState$(
				(deckState) => deckState?.gameStarted,
				(deckState) => deckState?.gameEnded,
				(deckState) => deckState?.isBattlegrounds(),
				(deckState) => deckState?.isMercenaries(),
			),
		).pipe(
			this.mapData(([[currentScene, displayFromPrefs], [gameStarted, gameEnded, isBgs, isMercs]]) => {
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

		this.heroPower$ = this.store
			.listenDeckState$((state) => state.playerDeck?.heroPower)
			.pipe(this.mapData(([heroPower]) => heroPower));
	}
}
