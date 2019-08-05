import { Component, HostListener, ChangeDetectionStrategy, AfterViewInit, ChangeDetectorRef, EventEmitter, ViewRef } from '@angular/core';

import { DebugService } from '../../services/debug.service';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'settings',
	styleUrls: [`../../../css/global/components-global.scss`, `../../../css/component/settings/settings.component.scss`],
	template: `
		<div class="root">
			<div class="app-container">
				<section class="title-bar">
					<div class="title">Settings</div>
					<div class="controls">
						<control-close [windowId]="thisWindowId"></control-close>
					</div>
				</section>
				<settings-app-selection [selectedApp]="selectedApp" (onAppSelected)="onAppSelected($event)"> </settings-app-selection>
				<ng-container [ngSwitch]="selectedApp">
					<settings-general *ngSwitchCase="'general'"></settings-general>
					<settings-collection *ngSwitchCase="'collection'"></settings-collection>
					<settings-achievements *ngSwitchCase="'achievements'"></settings-achievements>
					<settings-decktracker *ngSwitchCase="'decktracker'"></settings-decktracker>
				</ng-container>
				<settings-modal></settings-modal>
			</div>

			<i class="i-54 gold-theme corner top-left">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
				</svg>
			</i>
			<i class="i-54 gold-theme corner top-right">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
				</svg>
			</i>
			<i class="i-54 gold-theme corner bottom-right">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
				</svg>
			</i>
			<i class="i-54 gold-theme corner bottom-left">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
				</svg>
			</i>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements AfterViewInit {
	thisWindowId: string;
	selectedApp = 'general';
	private settingsEventBus: EventEmitter<string>;

	constructor(private debugService: DebugService, private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	async ngAfterViewInit() {
		this.thisWindowId = (await this.ow.getCurrentWindow()).id;
		window['selectApp'] = this.onAppSelected;
		this.settingsEventBus = this.ow.getMainWindow().settingsEventBus;
		this.settingsEventBus.subscribe(selectedApp => this.selectApp(selectedApp));
		this.ow.addMessageReceivedListener(async message => {
			if (message.id === 'move') {
				const window = await this.ow.getCurrentWindow();
				const newX = message.content.x - window.width / 2;
				const newY = message.content.y - window.height / 2;
				this.ow.changeWindowPosition(this.thisWindowId, newX, newY);
			}
		});

		// overwolf.games.onGameInfoUpdated.addListener((res: any) => {
		// 	// console.log('updated game', res);
		// 	if (this.exitGame(res)) {
		// 		this.closeApp();
		// 	}
		// });
	}

	onAppSelected(selectedApp: string) {
		this.selectedApp = selectedApp;
	}

	selectApp(selectedApp: string) {
		console.log('selectApp', selectedApp);
		this.selectedApp = selectedApp;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		this.ow.dragMove(this.thisWindowId);
	}

	// private exitGame(gameInfoResult: any): boolean {
	// 	return (!gameInfoResult || !gameInfoResult.gameInfo || !gameInfoResult.gameInfo.isRunning);
	// }

	// private closeApp() {
	// 	overwolf.windows.getCurrentWindow((result) => {
	// 		if (result.status === "success") {
	// 			console.log('closing');
	// 			overwolf.windows.close(result.window.id);
	// 		}
	// 	});
	// }
}
