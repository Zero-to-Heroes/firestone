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
import { Events } from '../services/events.service';
import { OverwolfService } from '../services/overwolf.service';

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
export class WindowWrapperComponent implements AfterViewInit, OnDestroy {
	@Input() allowResize = false;
	maximized: boolean;
	screenCaptureOn: boolean;

	private stateChangedListener: (message: any) => void;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly events: Events,
	) {}

	async ngAfterViewInit() {
		const window = await this.ow.getCurrentWindow();

		this.stateChangedListener = this.ow.addStateChangedListener(window.name, (message) => {
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
		const window = await this.ow.getCurrentWindow();
		this.ow.dragResize(window.id, edge);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.ow.removeStateChangedListener(this.stateChangedListener);
	}
}
