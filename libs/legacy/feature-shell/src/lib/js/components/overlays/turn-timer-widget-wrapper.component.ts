import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { GameType, SceneMode } from '@firestone-hs/reference-data';
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'turn-timer-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<turn-timer-widget
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></turn-timer-widget>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnTimerWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 300;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => gameHeight / 2;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateTurnTimerWidgetPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.turnTimerWidgetPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = {
		left: -50,
		right: -50,
		top: -50,
		bottom: -50,
	};

	showWidget$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs);

		this.showWidget$ = combineLatest([
			this.store.listenDeckState$(
				(state) => state?.metadata?.gameType,
				(state) => state?.gameStarted,
				(state) => state?.gameEnded,
			),
			this.scene.currentScene$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.showTurnTimer)),
		]).pipe(
			this.mapData(
				([[gameType, gameStarted, gameEnded], currentScene, pref]) =>
					pref &&
					gameStarted &&
					!gameEnded &&
					currentScene === SceneMode.GAMEPLAY &&
					[
						GameType.GT_CASUAL,
						GameType.GT_PVPDR,
						GameType.GT_PVPDR_PAID,
						GameType.GT_RANKED,
						GameType.GT_TAVERNBRAWL,
						GameType.GT_VS_AI,
						GameType.GT_VS_FRIEND,
						GameType.GT_ARENA,
						GameType.GT_UNDERGROUND_ARENA,
					].includes(gameType),
			),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
