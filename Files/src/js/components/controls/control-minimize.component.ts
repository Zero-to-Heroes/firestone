import { Component, ViewEncapsulation, ChangeDetectionStrategy, Input } from '@angular/core';

declare var overwolf: any;

@Component({
	selector: 'control-minimize',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-minimize.component.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
        <button class="i-30 pink-button" (click)="minimizeWindow()">
            <svg class="svg-icon-fill">
                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_minimize"></use>
            </svg>
        </button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlMinimizeComponent {

    @Input() windowId: string;

	minimizeWindow() {
		overwolf.windows.minimize(this.windowId);
	};
}
