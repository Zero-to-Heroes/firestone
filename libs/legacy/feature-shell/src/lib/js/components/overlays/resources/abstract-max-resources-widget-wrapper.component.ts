import { AfterContentInit, ChangeDetectorRef, Directive, ElementRef, Renderer2, ViewRef } from '@angular/core';
import { isBattlegrounds, isMercenaries, SceneMode } from '@firestone-hs/reference-data';
import { AbstractWidgetWrapperComponent, DeckState, GameState, GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { sleep } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, debounceTime, distinctUntilChanged, filter, Observable, switchMap, takeUntil } from 'rxjs';
import { isDefault, MaxResources, nullIfDefaultCoins, nullIfDefaultHealth, nullIfDefaultMana } from './model';

// https://stackoverflow.com/questions/62222979/angular-9-decorators-on-abstract-base-class
@Directive()
export abstract class AbstractMaxResourcesWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected abstract prefName: keyof Preferences;
	protected abstract alwaysOnPrefName: keyof Preferences;
	protected abstract positionPrefName: keyof Preferences;
	protected abstract scalePrefName: keyof Preferences;
	protected abstract deckExtractor: (gameState: GameState) => DeckState;

	protected abstract defaultPositionLeftProvider: (gameWidth: number, gameHeight: number) => number;
	protected abstract defaultPositionTopProvider: (gameWidth: number, gameHeight: number) => number;

	protected positionUpdater = (left: number, top: number) =>
		this.prefs.updatePrefs(this.positionPrefName, { left, top });
	protected positionExtractor = async () => {
		const prefs = await this.prefs.getPreferences();
		return prefs[this.positionPrefName] as { left: number; top: number };
	};
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = {
		left: -50,
		right: -50,
		top: -50,
		bottom: -50,
	};

	showWidget$: Observable<boolean>;
	maxResources$: Observable<MaxResources | null>;
	opacity$: Observable<number | null>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
		protected readonly scene: SceneService,
		protected readonly gameState: GameStateFacadeService,
	) {
		super(cdr, ow, el, prefs, renderer);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs);

		const gameMode$ = this.gameState.gameState$$.pipe(
			this.mapData((gameState) => gameState?.metadata?.gameType),
			distinctUntilChanged(),
			takeUntil(this.destroyed$),
		);
		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.gameState.gameState$$.pipe(
				this.mapData((gameState) => !!gameState?.gameStarted && !gameState?.gameEnded),
			),
			this.prefs.preferences$$,
			gameMode$,
		]).pipe(
			this.mapData(
				([currentScene, inGame, prefs, gameMode]) =>
					inGame &&
					prefs[this.prefName] &&
					currentScene === SceneMode.GAMEPLAY &&
					// !isBattlegrounds(gameMode) &&
					!isMercenaries(gameMode),
			),
			this.handleReposition(),
		);
		this.opacity$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => (prefs.globalWidgetOpacity ?? 100) / 100),
		);
		const alwaysOn$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs[this.alwaysOnPrefName]));
		const maxResources$ = this.gameState.gameState$$.pipe(
			debounceTime(500),
			this.mapData((gameState) => {
				const isBg = isBattlegrounds(gameState?.metadata?.gameType);
				const result: MaxResources = {
					health: isBg ? null : this.deckExtractor(gameState).hero?.maxHealth ?? 30,
					mana: isBg ? null : this.deckExtractor(gameState).hero?.maxMana ?? 10,
					coins: isBg ? this.deckExtractor(gameState).hero?.maxCoins ?? 10 : null,
				};
				return result;
			}),
			distinctUntilChanged((a, b) => a.health === b.health && a.mana === b.mana && a.coins === b.coins),
			takeUntil(this.destroyed$),
		);
		this.maxResources$ = combineLatest([maxResources$, alwaysOn$]).pipe(
			this.mapData(([maxResources, alwaysOn]) => {
				if (alwaysOn) {
					return maxResources;
				}
				if (isDefault(maxResources)) {
					return null;
				}
				const result: MaxResources = {
					health: nullIfDefaultHealth(maxResources.health),
					mana: nullIfDefaultMana(maxResources.mana),
					coins: nullIfDefaultCoins(maxResources.coins),
				};
				return result;
			}),
		);
		this.showWidget$
			.pipe(
				// Recompute the scale whenever the widget is shown
				filter((show) => show),
				switchMap((show) =>
					combineLatest([
						this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
						this.prefs.preferences$$.pipe(
							this.mapData((prefs) => (prefs[this.scalePrefName] ?? 100) as number),
						),
					]),
				),
				// tap(([globalScale, scale]) => console.debug('[max-resources] new scale params', globalScale, scale)),
				takeUntil(this.destroyed$),
			)
			.subscribe(async ([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				const element = await this.getScalable();
				// console.debug('[max-resources] setting scale', newScale, element);
				if (!!element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				}
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async getScalable(): Promise<ElementRef<HTMLElement>> {
		let element = this.el.nativeElement.querySelector('.scalable');
		let retriesLeft = 10;
		while (!element && retriesLeft > 0) {
			await sleep(200);
			element = this.el.nativeElement.querySelector('.scalable');
			retriesLeft--;
		}
		return element;
	}
}
