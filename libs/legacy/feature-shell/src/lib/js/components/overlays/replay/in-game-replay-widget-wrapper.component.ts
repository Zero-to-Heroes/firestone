import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { InGameReplayService } from '@firestone/mods/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'in-game-replay-widget-wrapper',
	styleUrls: [
		'../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss',
		'./in-game-replay-widget-wrapper.component.scss',
	],
	template: `
		<in-game-replay-widget
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></in-game-replay-widget>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InGameReplayWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 420;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 0;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateInGameReplayWidgetPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.inGameReplayWidgetPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
		private readonly replayService: InGameReplayService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.replayService);

		this.showWidget$ = this.replayService.isReplayOngoing$$.pipe(this.handleReposition());

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
