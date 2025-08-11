import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { AbstractWidgetWrapperComponent } from '@components/overlays/_widget-wrapper.component';
import { LotteryWidgetControllerService } from '@firestone/lottery/common';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';

@Component({
	standalone: false,
	selector: 'lottery-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<lottery
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></lottery>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotteryWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => 200;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 400;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateLotteryPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.lotteryPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = {
		left: 0,
		top: -20,
		right: 0,
		bottom: 0,
	};

	showWidget$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
		private readonly lottery: LotteryWidgetControllerService,
	) {
		super(ow, el, prefs, renderer, cdr);
		this.forceKeepInBounds = true;
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.showWidget$ = combineLatest([
			this.lottery.shouldShowOverlay$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.lotteryOverlay)),
		]).pipe(
			this.mapData(([shouldShowLotteryOverlay, overlay]) => shouldShowLotteryOverlay && overlay),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}
}
