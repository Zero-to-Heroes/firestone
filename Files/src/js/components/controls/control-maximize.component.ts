import {
	Component,
	ViewEncapsulation,
	ChangeDetectionStrategy,
	Input,
	ChangeDetectorRef,
	ViewRef,
} from '@angular/core';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'control-maximize',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-maximize.component.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<button class="i-30 pink-button" (click)="toggleMaximizeWindow()">
			<svg class="svg-icon-fill" *ngIf="!maximized">
				<use
					xmlns:xlink="http://www.w3.org/1999/xlink"
					xlink:href="/Files/assets/svg/sprite.svg#window-control_maximize"
				></use>
			</svg>
			<svg class="svg-icon-fill" *ngIf="maximized">
				<use
					xmlns:xlink="http://www.w3.org/1999/xlink"
					xlink:href="/Files/assets/svg/sprite.svg#window-control_restore"
				></use>
			</svg>
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlMaximizeComponent {
	@Input() windowId: string;

	maximized = false;

	// private previousWidth: number;
	// private previousHeight: number;

	constructor(private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	async toggleMaximizeWindow() {
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
}
