import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { OverwolfService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'control-maximize',
	styleUrls: [
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-maximize.component.scss`,
	],
	template: `
		<button (click)="toggleMaximizeWindow()" [attr.aria-label]="'Go fullscreen'">
			<svg class="svg-icon-fill" *ngIf="!maximized">
				<use
					xmlns:xlink="https://www.w3.org/1999/xlink"
					xlink:href="assets/svg/sprite.svg#window-control_maximize"
				></use>
			</svg>
			<svg class="svg-icon-fill" *ngIf="maximized">
				<use
					xmlns:xlink="https://www.w3.org/1999/xlink"
					xlink:href="assets/svg/sprite.svg#window-control_restore"
				></use>
			</svg>
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlMaximizeComponent implements AfterViewInit, OnDestroy {
	maximized = false;

	private stateChangedListener: (message: any) => void;

	constructor(
		private ow: OverwolfService,
		private el: ElementRef,
		private cdr: ChangeDetectorRef,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {}

	async ngAfterViewInit() {
		if (!this.ow?.isOwEnabled()) {
			return;
		}
		const currentWindow = await this.ow.getCurrentWindow();
		const windowName = currentWindow.name;
		this.stateChangedListener = this.ow.addStateChangedListener(windowName, (message) => {
			this.maximized = message.window_state_ex === 'maximized';
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.markForCheck();
			}
		});

		// Set the "maximized" status if the window is effectively maximized (esp. when restoring a window)
		this.maximized = currentWindow.stateEx === 'maximized';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	async toggleMaximizeWindow() {
		if (!this.ow?.isOwEnabled()) {
			return;
		}
		const windowId = (await this.ow.getCurrentWindow()).id;

		if (this.maximized) {
			await this.ow.restoreWindow(windowId);
			this.maximized = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.markForCheck();
			}
		} else {
			await this.ow.maximizeWindow(windowId);
			this.maximized = true;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.markForCheck();
			}
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.ow.removeStateChangedListener(this.stateChangedListener);
	}
}
