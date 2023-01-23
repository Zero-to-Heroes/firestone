import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { Preferences } from '../../models/preferences';
import { isMercenariesPvE, isMercenariesPvP } from '../../services/mercenaries/mercenaries-utils';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'mercs-action-queue-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<mercenaries-action-queue
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
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
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	ngAfterContentInit(): void {
		this.showWidget$ = combineLatest(
			this.store.listenPrefs$(
				(prefs) => prefs.mercenariesEnableActionsQueueWidgetPvE,
				(prefs) => prefs.mercenariesEnableActionsQueueWidgetPvP,
			),
			this.store.listenMercenaries$(([state, prefs]) => state?.gameMode),
		).pipe(
			this.mapData(([[displayFromPrefsPvE, displayFromPrefsPvP], [gameMode]]) => {
				return (
					(displayFromPrefsPvE && isMercenariesPvE(gameMode)) ||
					(displayFromPrefsPvP && isMercenariesPvP(gameMode))
				);
			}),
			this.handleReposition(),
		);
	}
}
