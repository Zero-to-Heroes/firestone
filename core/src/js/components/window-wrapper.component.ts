import { animate, style, transition, trigger } from '@angular/animations';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { map, takeUntil } from 'rxjs/operators';
import { Events } from '../services/events.service';
import { OverwolfService } from '../services/overwolf.service';
import { AppUiStoreFacadeService } from '../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from './abstract-subscription.component';

@Component({
	selector: 'window-wrapper',
	styleUrls: [
		`../../css/global/reset-styles.scss`,
		`../../css/global/cdk-overlay.scss`,
		`../../css/component/window-wrapper.component.scss`,
		`../../css/themes/collection-theme.scss`,
		`../../css/themes/achievements-theme.scss`,
		`../../css/themes/battlegrounds-theme.scss`,
		`../../css/themes/decktracker-theme.scss`,
		`../../css/themes/decktracker-desktop-theme.scss`,
		`../../css/themes/replays-theme.scss`,
		`../../css/themes/duels-theme.scss`,
		`../../css/themes/general-theme.scss`,
	],
	template: `
		<div class="top" [ngClass]="{ 'maximized': maximized || !allowResize }">
			<div class="root">
				<div class="background-backup"></div>
				<div class="app-container overlay-container-parent">
					<ng-content></ng-content>
				</div>

				<version></version>
				<div class="screen-capture-effect" *ngIf="screenCaptureOn" [@screenCapture]></div>
			</div>

			<div class="resize horizontal top" (mousedown)="dragResize($event, 'Top')"></div>
			<div class="resize vertical left" (mousedown)="dragResize($event, 'Left')"></div>
			<div class="resize vertical right" (mousedown)="dragResize($event, 'Right')"></div>
			<div class="resize horizontal bottom" (mousedown)="dragResize($event, 'Bottom')"></div>

			<div class="resize corner top-left" (mousedown)="dragResize($event, 'TopLeft')"></div>
			<div class="resize corner top-right" (mousedown)="dragResize($event, 'TopRight')"></div>
			<div class="resize corner bottom-left" (mousedown)="dragResize($event, 'BottomLeft')"></div>
			<div class="resize corner bottom-right" (mousedown)="dragResize($event, 'BottomRight')"></div>
		</div>
	`,
	animations: [
		trigger('screenCapture', [
			transition(':enter', [style({ opacity: 0 }), animate('200ms', style({ opacity: 1 }))]),
			transition(':leave', [style({ opacity: 1 }), animate('200ms', style({ opacity: 0 }))]),
		]),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class WindowWrapperComponent extends AbstractSubscriptionComponent implements AfterViewInit, OnDestroy {
	@Input() allowResize = false;

	maximized: boolean;
	screenCaptureOn: boolean;

	private EXCLUDED_WINDOW_IDS = [
		'Window_Extension_lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob_SettingsWindow',
		'Window_Extension_lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob_SettingsOverlayWindow',
	];

	private stateChangedListener: (message: any) => void;
	private windowId: string;

	private zoom = 1;
	private originalWidth = 0;
	private originalHeight = 0;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly events: Events,
		private readonly store: AppUiStoreFacadeService,
	) {
		super();
	}

	async ngAfterViewInit() {
		const currentWindow = await this.ow.getCurrentWindow();
		this.windowId = currentWindow.id;
		console.log('windowId', this.windowId);

		this.store
			.listen$(([main, nav, prefs]) => prefs.globalZoomLevel)
			.pipe(
				map(([zoom]) => zoom),
				takeUntil(this.destroyed$),
			)
			.subscribe(async (zoom) => {
				const normalized = (zoom ?? 0) / 100;
				this.zoom = normalized <= 1 ? 0 : normalized;
				if (this.EXCLUDED_WINDOW_IDS.includes(this.windowId)) {
					this.zoom = 0;
				}
				if (!this.originalHeight || !this.originalWidth) {
					const currentWindow = await this.ow.getCurrentWindow();
					this.originalWidth = currentWindow.width / Math.max(1, this.zoom);
					this.originalHeight = currentWindow.height / Math.max(1, this.zoom);
					console.log('setting originalWidth', this.originalWidth, 'originalHeight', this.originalHeight);
				}
				// 0 is the unzoomed value
				// It behaves a bit strangely. When values are > 1, the zoom behaves as expected
				// If values are between 0 and 1, it looks like
				this.ow.setZoom(this.zoom);
				this.changeWindowSize();
			});

		this.stateChangedListener = this.ow.addStateChangedListener(currentWindow.name, (message) => {
			if (message.window_state_ex === 'maximized') {
				this.maximized = true;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			} else {
				this.maximized = false;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}
		});
		this.events.on(Events.SHOW_SCREEN_CAPTURE_EFFECT).subscribe((event) => {
			this.screenCaptureOn = true;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}

			setTimeout(() => {
				this.screenCaptureOn = false;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}, 200);
		});
	}

	async dragResize(event: MouseEvent, edge) {
		if (this.maximized || !this.allowResize) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		await this.ow.dragResize(this.windowId, edge);
		const window = await this.ow.getCurrentWindow();
		this.originalWidth = window.width;
		this.originalHeight = window.height;
		if (!this.originalHeight || !this.originalWidth || isNaN(this.originalHeight) || isNaN(this.originalWidth)) {
			console.error('missing dimensions info', this.originalWidth, this.originalHeight, window);
			return;
		}
	}

	private async changeWindowSize(): Promise<void> {
		if (!this.originalHeight || !this.originalWidth || isNaN(this.originalHeight) || isNaN(this.originalWidth)) {
			console.error('missing dimension info', this.originalWidth, this.originalHeight);
			return;
		}
		await this.ow.changeWindowSize(
			this.windowId,
			Math.max(this.originalWidth, this.zoom * this.originalWidth),
			Math.max(this.originalHeight, this.zoom * this.originalHeight),
		);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		this.ow.removeStateChangedListener(this.stateChangedListener);
	}
}
