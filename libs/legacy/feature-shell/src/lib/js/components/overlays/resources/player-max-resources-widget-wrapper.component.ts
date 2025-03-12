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
import { AbstractWidgetWrapperComponent, GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { deepEqual, sleep } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, debounceTime, distinctUntilChanged, filter, Observable, switchMap, takeUntil, tap } from 'rxjs';
import { isDefault, MaxResources, nullIfDefaultHealth, nullIfDefaultMana } from './model';

@Component({
	selector: 'player-max-resources-widget-wrapper',
	styleUrls: ['./player-max-resources-widget-wrapper.component.scss'],
	template: `
		<max-resources-widget
			*ngIf="showWidget$ | async"
			class="widget scalable"
			[maxResources]="maxResources$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></max-resources-widget>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerMaxResourcesWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) =>
		gameWidth / 2 + gameHeight * 0.25;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.83;
	protected positionUpdater = (left: number, top: number) =>
		this.prefs.updatePrefs('playerMaxResourcesWidgetPosition', { left, top });
	protected positionExtractor = async () => {
		const prefs = await this.prefs.getPreferences();
		return prefs.playerMaxResourcesWidgetPosition;
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

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly gameState: GameStateFacadeService,
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
		this.showWidget$ = combineLatest([this.scene.currentScene$$, this.prefs.preferences$$, gameMode$]).pipe(
			this.mapData(
				([currentScene, prefs, gameMode]) =>
					prefs.showPlayerMaxResourcesWidget &&
					currentScene === SceneMode.GAMEPLAY &&
					!isBattlegrounds(gameMode) &&
					!isMercenaries(gameMode),
			),
			this.handleReposition(),
		);
		const alwaysOn$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.playerMaxResourcesWidgetAlwaysOn),
		);
		const maxResources$ = this.gameState.gameState$$.pipe(
			debounceTime(500),
			this.mapData((gameState) => {
				const result: MaxResources = {
					health: gameState.playerDeck.hero?.maxHealth ?? 30,
					mana: gameState.playerDeck.hero?.maxMana ?? 10,
				};
				return result;
			}),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
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
						this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.maxResourcesWidgetScale ?? 100)),
					]),
				),
				tap(([globalScale, scale]) => console.debug('[max-resources] new scale params', globalScale, scale)),
				takeUntil(this.destroyed$),
			)
			.subscribe(async ([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				const element = await this.getScalable();
				console.debug('[max-resources] setting scale', newScale, element);
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
