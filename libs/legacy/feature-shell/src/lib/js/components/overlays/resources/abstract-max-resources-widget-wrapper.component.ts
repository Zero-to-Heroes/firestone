import { AfterContentInit, ChangeDetectorRef, Directive, ElementRef, Renderer2, ViewRef } from '@angular/core';
import { isBattlegrounds, isMercenaries, SceneMode } from '@firestone-hs/reference-data';
import { AbstractWidgetWrapperComponent } from '@firestone/app/view';
import { DeckState, GameState, GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { sleep } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, debounceTime, distinctUntilChanged, filter, Observable, switchMap, takeUntil } from 'rxjs';
import {
	isDefault,
	MaxResources,
	nullIfDefaultCoins,
	nullIfDefaultCorpses,
	nullIfDefaultHealth,
	nullIfDefaultMana,
} from './model';

// https://stackoverflow.com/questions/62222979/angular-9-decorators-on-abstract-base-class
@Directive()
export abstract class AbstractMaxResourcesWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected abstract prefName: keyof Preferences;
	protected abstract alwaysOnPrefName: keyof Preferences;
	protected abstract showCorpsesPrefName: keyof Preferences;
	protected abstract positionPrefName: keyof Preferences;
	protected abstract positionPrefNameBgs: keyof Preferences;
	protected abstract scalePrefName: keyof Preferences;
	protected abstract deckExtractor: (gameState: GameState) => DeckState;

	protected abstract defaultPositionLeftProviderStandard: (gameWidth: number, gameHeight: number) => number;
	protected abstract defaultPositionTopProviderStandard: (gameWidth: number, gameHeight: number) => number;
	protected abstract defaultPositionLeftProviderBgs: (gameWidth: number, gameHeight: number) => number;
	protected abstract defaultPositionTopProviderBgs: (gameWidth: number, gameHeight: number) => number;

	private currentIsBgs = false;

	protected override defaultPositionLeftProvider = (gameWidth: number, gameHeight: number): number =>
		this.currentIsBgs
			? this.defaultPositionLeftProviderBgs(gameWidth, gameHeight)
			: this.defaultPositionLeftProviderStandard(gameWidth, gameHeight);
	protected override defaultPositionTopProvider = (gameWidth: number, gameHeight: number): number =>
		this.currentIsBgs
			? this.defaultPositionTopProviderBgs(gameWidth, gameHeight)
			: this.defaultPositionTopProviderStandard(gameWidth, gameHeight);

	protected positionUpdater = (left: number, top: number) => {
		const prefName = this.currentIsBgs ? this.positionPrefNameBgs : this.positionPrefName;
		return this.prefs.updatePrefs(prefName, { left, top });
	};
	protected positionExtractor = async () => {
		const prefs = await this.prefs.getPreferences();
		const prefName = this.currentIsBgs ? this.positionPrefNameBgs : this.positionPrefName;
		return prefs[prefName] as { left: number; top: number };
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
	showHorizontally$: Observable<boolean | null>;
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
		gameMode$.subscribe((gameMode) => {
			const wasBgs = this.currentIsBgs;
			this.currentIsBgs = isBattlegrounds(gameMode);
			if (wasBgs !== this.currentIsBgs) {
				this.reposition();
			}
		});
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
		this.showHorizontally$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.maxResourcesWidgetShowHorizontally),
		);
		const alwaysOn$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs[this.alwaysOnPrefName]));
		const showCorpses$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs[this.showCorpsesPrefName]));
		const maxResources$ = combineLatest([this.gameState.gameState$$, showCorpses$]).pipe(
			debounceTime(500),
			this.mapData(([gameState, showCorpses]) => {
				const isBg = isBattlegrounds(gameState?.metadata?.gameType);
				const result: MaxResources = {
					health: isBg ? null : (this.deckExtractor(gameState).hero?.maxHealth ?? 30),
					mana: isBg ? null : (this.deckExtractor(gameState).hero?.maxMana ?? 10),
					corpses:
						isBg || !showCorpses
							? null
							: (this.deckExtractor(gameState).corpsesGainedThisGame ?? 0) -
								(this.deckExtractor(gameState).corpsesSpent ?? 0),
					coins: isBg ? (this.deckExtractor(gameState).hero?.maxCoins ?? 10) : null,
				};
				console.debug('[max-resources] max resources', result);
				return result;
			}),
			distinctUntilChanged(
				(a, b) => a.health === b.health && a.mana === b.mana && a.coins === b.coins && a.corpses === b.corpses,
			),
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
					corpses: nullIfDefaultCorpses(maxResources.corpses),
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
			this.cdr.markForCheck();
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
