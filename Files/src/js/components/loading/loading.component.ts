import { Component, ViewEncapsulation, ElementRef, HostListener, NgZone, AfterViewInit } from '@angular/core';

import { DebugService } from '../../services/debug.service';

import * as Raven from 'raven-js';

const HEARTHSTONE_GAME_ID = 9898;

declare var overwolf: any;
declare var adsReady: any;
declare var OwAd: any;
declare var Crate: any;

@Component({
	selector: 'loading',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/loading/loading.component.scss`
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="root">
			<div class="app-container">
				<section class="menu-bar">
					<i class="i-117X33 gold-theme logo">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#logo"/>
						</svg>
					</i>
					<div class="controls">
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
						<button class="i-30 close-button" (click)="closeWindow(true)">
							<svg class="svg-icon-fill">
								<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
							</svg>
						</button>
					</div>
				</section>
				<section class="content-container">
					<div class="app-title">
						<i class="i-35 gold-theme left">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#title_decor"/>
							</svg>
						</i>
						<span class="title">{{title}}</span>
						<i class="i-35 gold-theme right">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#title_decor"/>
							</svg>
						</i>
					</div>
					<i class="i-54 loading-icon gold-theme" *ngIf="loading">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#loading_spiral"/>
						</svg>
					</i>
					<div class="sub-title" *ngIf="!loading">
						<span>Hit</span>
						<div class="hotkey" [innerHTML]="splitHotkey()"></div>
						<span>to view the app</span>
					</div>
					<div class="ads-container">
						<div class="no-ads-placeholder">
							<i class="i-117X33 gold-theme logo">
								<svg class="svg-icon-fill">
									<use xlink:href="/Files/assets/svg/sprite.svg#ad_placeholder"/>
								</svg>
							</i>
						</div>
						<div class="ads" id="ad-div" #ads></div>
					</div>
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
		</div>
	`,
})
// 7.1.1.17994
export class LoadingComponent implements AfterViewInit {

	title: string = 'Getting ready';
	loading = true;
	hotkey = 'Alt+C';

	private thisWindowId: string;
	private adRef;
	private crate;


	constructor(private debugService: DebugService, private ngZone: NgZone, private elRef: ElementRef) {
		console.log('in loading constructor');
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success"){
				this.thisWindowId = result.window.id;
			}
		});

		this.positionWindow();

		overwolf.windows.onMessageReceived.addListener((message) => {
			console.log('received', message);
			if (message.id === 'ready') {
				this.ngZone.run(() => {
					this.title = 'Your abilities are ready!';
					this.loading = false;
				})
			}
		});
		overwolf.windows.onStateChanged.addListener((message) => {
			if (message.window_name != "LoadingWindow") {
				return;
			}
			console.log('state changed loading', message);
			if (message.window_state != 'normal') {
				console.log('removing ad', message.window_state);
				this.adRef.removeAd();
			}
			else {
				console.log('refreshing ad', message.window_state);
				this.refreshAds();
			}
		});

		overwolf.settings.getHotKey('collection', (result) => {
			console.log('hot key is', result);
			if (result.status == 'success') {
				this.hotkey = result.hotkey;
			}
		});
	}

	ngAfterViewInit() {
		this.loadAds();

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

	splitHotkey(): string {
		let split = this.hotkey.split('+');
		// console.log('split hot key', split);
		return split
			.map((splitItem) => `<span class="key">${splitItem}</span>`)
			.join('<span class="plus">+</span>');
	}


	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		overwolf.windows.dragMove(this.thisWindowId);
	};

	closeWindow(quitApp: boolean) {
		// If game is not running, we close all other windows
		overwolf.games.getRunningGameInfo((res: any) => {
			overwolf.windows.close(this.thisWindowId);
		});
	};

	minimizeWindow() {
		overwolf.windows.minimize(this.thisWindowId);
	};

	contactSupport() {
		// let crate = new Crate({
		// 	server:"187101197767933952",
		// 	channel:"446045705392357376"
		// });
		// crate.on('toggle', open => {
		// 	if (!open) {
		// 		crate.hide();
		// 	}
		// })
	}

	private loadAds() {
		if (!adsReady) {
			setTimeout(() => {
				this.loadAds()
			}, 50);
			return;
		}
		console.log('ads ready', adsReady, document.getElementById("ad-div"));
		this.adRef = new OwAd(document.getElementById("ad-div"));
	}

	private refreshAds() {
		if (!this.adRef) {
			setTimeout(() => {
				this.refreshAds()
			}, 20);
			return;
		}
		this.adRef.refreshAd();
	}


	private positionWindow() {
		overwolf.games.getRunningGameInfo((gameInfo) => {
			let gameWidth = gameInfo.logicalWidth;
			let gameHeight = gameInfo.logicalHeight;
			let dpi = gameWidth / gameInfo.width;
			let newLeft = ~~(gameWidth * 0.4) - 440;
			let newTop = ~~(gameHeight * 0.1);
			console.log('logical info', gameWidth, gameHeight, newLeft, newTop, dpi);
			overwolf.windows.changePosition(this.thisWindowId, newLeft, newTop, (changePosition) => {
				console.log('changed window position');
			});
		});
	}
}
