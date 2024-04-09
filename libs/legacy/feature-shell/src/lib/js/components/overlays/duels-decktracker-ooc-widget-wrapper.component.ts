import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'duels-decktracker-ooc-widget-wrapper',
	styleUrls: [
		'../../../css/component/overlays/foreground-widget.component.scss',
		'../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		'../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss',
	],
	template: `
		<duels-decktracker-ooc
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></duels-decktracker-ooc>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDecktrackerOocWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 250;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 10;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateDuelsOocTrackerPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.duelsOocTrackerPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = {
		left: -100,
		right: -100,
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
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs);

		this.showWidget$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.duelsShowOocTracker)),
			this.scene.currentScene$$,
			this.store.listen$(([main, nav]) => main.duels.isOnDuelsMainScreen),
		]).pipe(
			this.mapData(([displayFromPrefs, currentScene, [isOnMainScreen]]) => {
				const result =
					// !isOnInitialTreasureSelectScreen &&
					displayFromPrefs && isOnMainScreen && currentScene === SceneMode.PVP_DUNGEON_RUN;
				// console.debug('[duels-ooc] show widget?', result, displayFromPrefs, isOnMainScreen, currentScene);
				return result;
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
