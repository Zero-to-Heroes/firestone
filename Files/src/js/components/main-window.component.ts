import { Component, ViewEncapsulation, HostListener, AfterViewInit } from '@angular/core';

import * as Raven from 'raven-js';

import { DebugService } from '../services/debug.service';
import { Events } from '../services/events.service';

declare var overwolf: any;
declare var ga: any;
declare var Crate: any;

@Component({
	selector: 'main-window',
	styleUrls: [
		`../../css/global/components-global.scss`,
		`../../css/component/main-window.component.scss`
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="root">
			<div class="app-container">
				<section class="menu-bar">
					<div class="first">
						<real-time-notifications></real-time-notifications>
						<div class="navigation">
							<i class="i-117X33 gold-theme logo">
								<svg class="svg-icon-fill">
									<use xlink:href="/Files/assets/svg/sprite.svg#logo"/>
								</svg>
							</i>
							<menu-selection></menu-selection>
						</div>
					</div>
					<!-- <player-name></player-name> -->
					<div class="hotkey" [innerHTML]="splitHotkey()"></div>
					<div class="controls">
						<button class="i-30 pink-button" (click)="goHome()">
							<svg class="svg-icon-fill">
								<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_home"></use>
							</svg>
						</button>
						<!-- <button class="i-30 pink-button" (click)="showSettings()">
							<svg class="svg-icon-fill">
								<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_settings"></use>
							</svg>
						</button> -->
						<button class="i-30 pink-button" (click)="contactSupport()">
							<svg class="svg-icon-fill">
								<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_support"></use>
							</svg>
						</button>
						<button class="i-30 pink-button" (click)="minimizeWindow()">
							<svg class="svg-icon-fill">
								<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_minimize"></use>
							</svg>
						</button>
						<button class="i-30 close-button" (click)="closeWindow()">
							<svg class="svg-icon-fill">
								<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
							</svg>
						</button>
					</div>
				</section>
				<section class="content-container">
					<ng-container [ngSwitch]="selectedModule">
						<collection *ngSwitchCase="'collection'" class="main-section"></collection>
					</ng-container>
				</section>
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
			<!--<card-modal></card-modal>-->
			<!--<login *ngIf="showLogin" (close)="showLogin = false"></login>-->

			<tooltips></tooltips>
		</div>
	`,
})
// 7.1.1.17994
export class MainWindowComponent implements AfterViewInit {

	private version;
	private maximized = false;
	private lastSize: any;
	private crate;
	private showLogin = false;
	private windowId: string;
	private selectedModule = 'collection';
	private hotkey = 'Alt+C';

	constructor(
		private debugService: DebugService,
		private events: Events) {

		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success"){
				this.windowId = result.window.id;
			}
		});

		this.events.on(Events.MODULE_SELECTED).subscribe(
			(data) => {
				this.selectedModule = data.data[0];
				// console.log('selected module', this.selectedModule);
			}
		)

		overwolf.settings.getHotKey('collection', (result) => {
			console.log('hot key is', result);
			if (result.status == 'success') {
				this.hotkey = result.hotkey;
			}
		});
	}

	ngAfterViewInit() {
		setTimeout(() => {
			this.crate = new Crate({
				server:"187101197767933952",
				channel:"446045705392357376"
			});
			this.crate.store.subscribe(() => {
				if (this.crate.store.getState().visible && !this.crate.store.getState().open) {
					this.crate.hide();
				}
			});
			this.crate.hide();
		}, 100);
	}

	@HostListener('mousedown')
	private dragMove() {
		overwolf.windows.dragMove(this.windowId);
	};

	private goHome() {
		overwolf.windows.obtainDeclaredWindow("WelcomeWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get WelcomeWindow', result);
				return;
			}
			console.log('got welcome window', result);
			overwolf.windows.restore(result.window.id, (result) => {
				this.closeWindow();
			})
		});
	};

	private splitHotkey(): string {
		let split = this.hotkey.split('+');
		// console.log('split hot key', split);
		return '<span class="text">Hotkey:</span>' + split
			.map((splitItem) => `<span class="key">${splitItem}</span>`)
			.join('<span class="plus">+</span>');
	}

	private closeWindow() {
		overwolf.windows.hide(this.windowId);
	};

	private minimizeWindow() {
		overwolf.windows.minimize(this.windowId);
	};

	private contactSupport() {
		if (!this.crate) {
			setTimeout(() => this.contactSupport(), 50);
			return;
		}
		this.crate.toggle(true);
		this.crate.show();
	}
}
