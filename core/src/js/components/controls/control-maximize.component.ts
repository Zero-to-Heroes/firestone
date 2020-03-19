import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

declare let amplitude;

@Component({
	selector: 'control-maximize',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-maximize.component.scss`,
	],
	template: `
		<button (click)="toggleMaximizeWindow()">
			<svg class="svg-icon-fill" *ngIf="!maximized">
				<use
					xmlns:xlink="https://www.w3.org/1999/xlink"
					xlink:href="/Files/assets/svg/sprite.svg#window-control_maximize"
				></use>
			</svg>
			<svg class="svg-icon-fill" *ngIf="maximized">
				<use
					xmlns:xlink="https://www.w3.org/1999/xlink"
					xlink:href="/Files/assets/svg/sprite.svg#window-control_restore"
				></use>
			</svg>
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlMaximizeComponent implements AfterViewInit, OnDestroy {
	@Input() windowId: string;
	@Input() eventProvider: () => MainWindowStoreEvent;

	maximized = false;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private stateChangedListener: (message: any) => void;

	constructor(private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	async ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;

		const windowName = (await this.ow.getCurrentWindow()).name;
		this.stateChangedListener = this.ow.addStateChangedListener(windowName, message => {
			console.log('received message', message);
			if (message.window_state === 'maximized') {
				this.maximized = true;
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			} else {
				this.maximized = false;
				console.log('showing not maximied');
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			}
		});
	}

	async toggleMaximizeWindow() {
		const windowName = (await this.ow.getCurrentWindow()).name;
		amplitude.getInstance().logEvent('maximize', { 'window': windowName });

		// Delegate all the logic
		if (this.eventProvider) {
			this.stateUpdater.next(this.eventProvider());
			return;
		}
		if (this.maximized) {
			await this.ow.restoreWindow(this.windowId);
			this.maximized = false;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		} else {
			// const window = await this.ow.getCurrentWindow();
			// this.previousWidth = window.width;
			// this.previousHeight = window.height;
			await this.ow.maximizeWindow(this.windowId);
			this.maximized = true;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		}
	}

	ngOnDestroy(): void {
		this.ow.removeStateChangedListener(this.stateChangedListener);
	}
}
