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
import { combineLatest, debounceTime, distinctUntilChanged, Observable, takeUntil } from 'rxjs';
import { isDefault, MaxResources } from './model';

@Component({
	selector: 'opponent-max-resources-widget-wrapper',
	styleUrls: ['./opponent-max-resources-widget-wrapper.component.scss'],
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
export class OpponentMaxResourcesWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) =>
		gameWidth / 2 + gameHeight * 0.22;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.09;
	protected positionUpdater = (left: number, top: number) =>
		this.prefs.updatePrefs('opponentMaxResourcesWidgetPosition', { left, top });
	protected positionExtractor = async () => {
		const prefs = await this.prefs.getPreferences();
		return prefs.opponentMaxResourcesWidgetPosition;
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
					prefs.showOpponentMaxResourcesWidget &&
					currentScene === SceneMode.GAMEPLAY &&
					!isBattlegrounds(gameMode) &&
					!isMercenaries(gameMode),
			),
			this.handleReposition(),
		);
		const alwaysOn$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.opponentMaxResourcesWidgetAlwaysOn),
		);
		const maxResources$ = this.gameState.gameState$$.pipe(
			debounceTime(500),
			this.mapData((gameState) => {
				const result: MaxResources = {
					health: gameState.opponentDeck.hero?.maxHealth ?? 30,
					mana: gameState.opponentDeck.hero?.maxMana ?? 10,
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
				return maxResources;
			}),
		);
		combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.maxResourcesWidgetScale ?? 100)),
		])
			.pipe(takeUntil(this.destroyed$))
			.subscribe(async ([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				const element = await this.getScalable();
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
