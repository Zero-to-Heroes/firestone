import { Component, ViewEncapsulation, HostListener, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef, ViewChild } from '@angular/core';

import { DebugService } from '../services/debug.service';
import { Events } from '../services/events.service';
import { CollectionComponent } from './collection.component';
import { AchievementsComponent } from './achievements/achievements.component';

declare var overwolf: any;
declare var Crate: any;
declare var adsReady: any;
declare var OwAd: any;

@Component({
	selector: 'main-window',
	styleUrls: [
		`../../css/global/components-global.scss`,
		`../../css/component/main-window.component.scss`
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="root">
			<div class="app-container {{selectedModule}}">
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
					<hotkey></hotkey>
					<div class="controls">
						<button class="i-30 pink-button" (click)="goHome()">
							<svg class="svg-icon-fill">
								<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_home"></use>
							</svg>
						</button>
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
					<collection #collection [hidden]="selectedModule !== 'collection'" class="main-section"></collection>
					<achievements #achievements [hidden]="selectedModule !== 'achievements'" class="main-section"></achievements>
					<div class="ads-container">
						<div class="no-ads-placeholder">
							<i class="i-117X33 gold-theme logo">
								<svg class="svg-icon-fill">
									<use xlink:href="/Files/assets/svg/sprite.svg#ad_placeholder"/>
								</svg>
							</i>
						</div>
						<div class="ads" id="ad-div"></div>
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

			<ftue></ftue>
			<tooltips></tooltips>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainWindowComponent implements AfterViewInit {

	@ViewChild('collection')
	private collection: CollectionComponent;
	@ViewChild('achievements')
	private achievements: AchievementsComponent;

	selectedModule = 'collection';

	private crate;
	private windowId: string;
	private adRef;
	private adInit = false;

	constructor(
		private events: Events, 
		private cdr: ChangeDetectorRef,
		private debug: DebugService) {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success"){
				this.windowId = result.window.id;
			}
		});
		overwolf.windows.onMessageReceived.addListener((message) => {
			if (message.id === 'move') {
				overwolf.windows.getCurrentWindow((result) => {
					if (result.status === "success"){
						const newX = message.content.x - result.window.width / 2;
						const newY = message.content.y - result.window.height / 2;
						overwolf.windows.changePosition(this.windowId, newX, newY);
					}
				});
				// console.log('received move message', message.content);
			}
			if (message.id === 'module') {
				this.selectedModule = message.content;
				this.events.broadcast(Events.MODULE_SELECTED, this.selectedModule);
				if (!(<ViewRef>this.cdr).destroyed) {
					this.cdr.detectChanges();
				}
				console.log('showing module from message', message);
			}
			if (message.id === 'click-card') {
				this.selectedModule = 'collection';
				this.events.broadcast(Events.MODULE_SELECTED, this.selectedModule);
				if (!(<ViewRef>this.cdr).destroyed) {
					this.cdr.detectChanges();
				}
				setTimeout(() => {
					this.collection.selectCard(message.content);
					overwolf.windows.restore(this.windowId);
				})
			}
			if (message.id === 'click-achievement') {
				this.selectedModule = 'achievements';
				this.events.broadcast(Events.MODULE_SELECTED, this.selectedModule);
				if (!(<ViewRef>this.cdr).destroyed) {
					this.cdr.detectChanges();
				}
				setTimeout(() => {
					this.achievements.selectAchievement(message.content);
				});
				overwolf.windows.restore(this.windowId);
			}
		});

		overwolf.windows.onStateChanged.addListener((message) => {
			if (message.window_name != "CollectionWindow") {
				return;
			}
			console.log('state changed CollectionWindow', message);
			if (message.window_state != 'normal') {
				console.log('removing ad', message.window_state);
				this.removeAds();
			}
			else {
				console.log('refreshing ad', message.window_state);
				this.initCrate();
				this.refreshAds();
			}
		});
		this.events.on(Events.MODULE_SELECTED).subscribe(
			(data) => {
				this.selectedModule = data.data[0];
				console.log('selected module', this.selectedModule);
			}
		);
	}

	ngAfterViewInit() {
		if (!Crate) {
			setTimeout(() => {
				this.ngAfterViewInit();
			}, 20);
			return;
		}
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success") {
				if (!result.window.isVisible) {
					return;
				}
				this.initCrate();
			}
		});
		this.refreshAds();
	}

	@HostListener('mousedown')
	dragMove() {
		overwolf.windows.dragMove(this.windowId);
	};

	goHome() {
		overwolf.windows.obtainDeclaredWindow("WelcomeWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get WelcomeWindow', result);
				return;
			}
			// console.log('got welcome window', result);
			// overwolf.windows.restore(result.window.id, (result) => {
			// 	this.closeWindow();
			// })
			overwolf.windows.getCurrentWindow((currentWindoResult) => {
				// console.log('current window', currentWindoResult);
				const center = {
					x: currentWindoResult.window.left + currentWindoResult.window.width / 2,
					y: currentWindoResult.window.top + currentWindoResult.window.height / 2
				};
				// console.log('center is', center);
				overwolf.windows.sendMessage(result.window.id, 'move', center, (result3) => {
					overwolf.windows.restore(result.window.id, (result2) => {
						this.closeWindow();
					});
				});
			});
		});
	};

	closeWindow() {
		overwolf.windows.hide(this.windowId);
	};

	minimizeWindow() {
		overwolf.windows.minimize(this.windowId);
	};

	contactSupport() {
		this.initCrate();
		this.crate.toggle();
		this.crate.show();
	}
	 
	private initCrate() {
		if (this.crate) {
			return;
		}
		this.crate = new Crate({
			server:"187101197767933952",
			channel:"446045705392357376",
			shard: 'https://cl4.widgetbot.io'
		});
		this.crate.store.subscribe(() => {
			if (this.crate.store.getState().visible && !this.crate.store.getState().open) {
				this.crate.hide();
			}
		});
		this.crate.hide();
	}

	private refreshAds() {
		 if (this.adInit) {
			 console.log('already initializing ads, returning');
			 return;
		 }
		 if (!adsReady) {
			 console.log('ads container not ready, returning');
			 setTimeout(() => {
				 this.refreshAds()
			 }, 50);
			 return;
		 }
		 if (!this.adRef) {
			 console.log('first time init ads, creating OwAd');
			 this.adInit = true;
			 overwolf.windows.getCurrentWindow((result) => {
				 if (result.status === "success") {
					 console.log('is window visible?', result);
					 if (result.window.isVisible) {
						 console.log('init OwAd');
						 this.adRef = new OwAd(document.getElementById('ad-div'));
					 }
					 this.adInit = false;
				 }
			 });
			 return;
		 }
		 console.log('refreshing ads');
		 this.adRef.refreshAd();
	 }
 
	 private removeAds() {
		 if (!this.adRef) {
			 return;
		 }
		 console.log('removing ads');
		 this.adRef.removeAd();
	 }
}
