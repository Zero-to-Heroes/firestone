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
import { isMercenariesPvE, isMercenariesPvP, MercenariesBattleStateFacadeService } from '@firestone/mercenaries/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, Observable } from 'rxjs';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'mercs-action-queue-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<mercenaries-action-queue
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></mercenaries-action-queue>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercsActionQueueWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 500;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 10;
	protected positionUpdater = (left: number, top: number) =>
		this.prefs.updateMercenariesActionsQueueOverlayPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.mercenariesActionsQueueOverlayPosition;
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
		protected readonly cdr: ChangeDetectorRef,
		private readonly mercenariesBattleStateFacade: MercenariesBattleStateFacadeService,
		private readonly scene: SceneService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.mercenariesBattleStateFacade, this.scene);

		this.showWidget$ = combineLatest([
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					displayFromPrefsPvE: prefs.mercenariesEnableActionsQueueWidgetPvE,
					displayFromPrefsPvP: prefs.mercenariesEnableActionsQueueWidgetPvP,
				})),
				distinctUntilChanged(
					(a, b) =>
						a.displayFromPrefsPvE === b.displayFromPrefsPvE &&
						a.displayFromPrefsPvP === b.displayFromPrefsPvP,
				),
			),
			this.mercenariesBattleStateFacade.store$$.pipe(this.mapData((state) => state?.gameMode)),
			this.scene.currentScene$$.pipe(this.mapData((scene) => scene)),
		]).pipe(
			this.mapData(([{ displayFromPrefsPvE, displayFromPrefsPvP }, gameMode, currentScene]) => {
				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}
				return (
					(displayFromPrefsPvE && isMercenariesPvE(gameMode)) ||
					(displayFromPrefsPvP && isMercenariesPvP(gameMode))
				);
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}
}
