import { Component, ViewEncapsulation, ChangeDetectionStrategy, Input, AfterViewInit, EventEmitter } from '@angular/core';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { CloseMainWindowEvent } from '../../services/mainwindow/store/events/close-main-window-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'control-minimize',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-minimize.component.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
        <button class="i-30 pink-button" (mousedown)="minimizeWindow()">
            <svg class="svg-icon-fill">
                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_minimize"></use>
            </svg>
        </button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlMinimizeComponent implements AfterViewInit {

    @Input() windowId: string;
	@Input() isMainWindow: boolean;
	
    private stateUpdater: EventEmitter<MainWindowStoreEvent>;
    
    constructor(private ow: OverwolfService) { }

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	minimizeWindow() {
		if (this.isMainWindow) {
			this.stateUpdater.next(new CloseMainWindowEvent());
        }
        this.ow.minimizeWindow(this.windowId);
	};
}
