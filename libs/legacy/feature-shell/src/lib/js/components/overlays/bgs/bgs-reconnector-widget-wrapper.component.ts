import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BnetRegion, SceneMode } from '@firestone-hs/reference-data';
import { GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { AccountService } from '@firestone/profile/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';

@Component({
	selector: 'bgs-reconnector-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<bgs-reconnector
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
			[isDragging]="isDragging"
		></bgs-reconnector>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsReconnectorWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => 10;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 10;
	protected positionUpdater = (left: number, top: number) =>
		this.prefs.updateWidgetPosition('bgsReconnectorWidgetPosition', left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.bgsReconnectorWidgetPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected draggable = false;
	protected debug = true;

	showWidget$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly account: AccountService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		console.log('[bgs-reconnector] ngAfterContentInit');
		await waitForReady(this.scene);
		console.log('[bgs-reconnector] scene ready');
		await waitForReady(this.account);
		console.log('[bgs-reconnector] account ready');
		await waitForReady(this.prefs);
		console.log('[bgs-reconnector] prefs ready');
		await waitForReady(this.gameState);
		console.log('[bgs-reconnector] gameState ready');
		await waitForReady(this.scene, this.account, this.prefs, this.gameState);
		console.log('[bgs-reconnector] ready');

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.account.region$$.pipe(this.mapData((info) => info)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsReconnectorEnabled)),
			this.gameState.gameState$$.pipe(this.mapData((state) => !!state?.gameStarted && !state?.gameEnded)),
		]).pipe(
			this.mapData(([currentScene, region, displayFromPrefs, inGame]) => {
				console.log(
					'[bgs-reconnector] should show widget?',
					region,
					region === BnetRegion.REGION_CN,
					inGame,
					displayFromPrefs,
					currentScene,
				);
				return (
					region === BnetRegion.REGION_CN && inGame && displayFromPrefs && currentScene === SceneMode.GAMEPLAY
				);
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
