import { Component, HostListener, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';

import { DebugService } from '../../services/debug.service';

declare var overwolf: any;

@Component({
	selector: 'settings',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/settings/settings.component.scss`
	],
	template: `
		<div class="root">
            <div class="app-container">
                <section class="title-bar">
                    <div class="title">Settings</div>
					<div class="controls">
                        <control-close [windowId]="thisWindowId"></control-close>
                    </div>
                </section>
                <settings-app-selection></settings-app-selection>
                <settings-achievements></settings-achievements>
				<settings-modal></settings-modal>
			</div>

			<i class="i-54 gold-theme corner top-left">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
				</svg>
			</i>
			<i class="i-54 gold-theme corner top-right">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
				</svg>
			</i>
			<i class="i-54 gold-theme corner bottom-right">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
				</svg>
			</i>
			<i class="i-54 gold-theme corner bottom-left">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
				</svg>
			</i>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements AfterViewInit {

	thisWindowId: string;

	constructor(private debugService: DebugService) {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success"){
				this.thisWindowId = result.window.id;
			}
		});
	}

	ngAfterViewInit() {
		overwolf.windows.onMessageReceived.addListener((message) => {
			if (message.id === 'move') {
				overwolf.windows.getCurrentWindow((result) => {
					if (result.status === "success") {
						const newX = message.content.x - result.window.width / 2;
						const newY = message.content.y - result.window.height / 2;
						overwolf.windows.changePosition(this.thisWindowId, newX, newY);
					}
				});
			}
		});
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		overwolf.windows.dragMove(this.thisWindowId);
	};

	closeWindow() {
		overwolf.windows.close(this.thisWindowId);
	};
}
