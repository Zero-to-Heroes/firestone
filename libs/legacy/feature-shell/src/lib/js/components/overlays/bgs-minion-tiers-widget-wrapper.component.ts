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
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'bgs-minion-tiers-widget-wrapper',
	styleUrls: ['./bgs-minion-tiers-widget-wrapper.component.scss'],
	template: `
		<battlegrounds-minions-tiers
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></battlegrounds-minions-tiers>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsMinionsTiersWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 252;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 20;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateBgsMinionsListPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.bgsMinionsListPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = {
		left: -150,
		top: -20,
		right: -150,
		bottom: -20,
	};

	showWidget$: Observable<boolean>;

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
			this.prefs.preferences$$.pipe(
				this.mapData(
					(prefs) =>
						(prefs.bgsEnableMinionListOverlay || prefs.bgsEnableTurnNumbertOverlay) && prefs.bgsFullToggle,
				),
			),
			this.gameState.gameState$$.pipe(
				auditTime(1000),
				this.mapData(
					(state) =>
						state.gameStarted &&
						// && !state.gameEnded // Keep it until we go back to the "lobby" screen
						isBattlegrounds(state.metadata?.gameType),
				),
			),
		]).pipe(
			this.mapData(([currentScene, displayFromPrefs, inGame]) => {
				return inGame && displayFromPrefs && currentScene === SceneMode.GAMEPLAY;
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
