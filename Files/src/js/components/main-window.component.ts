import { Component, ViewEncapsulation, HostListener, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef, ViewChild } from '@angular/core';

import { DebugService } from '../services/debug.service';
import { CollectionComponent } from './collection/collection.component';
import { AchievementsComponent } from './achievements/achievements.component';
import { MainWindowState as MainWindowState } from '../models/mainwindow/main-window-state';
import { BehaviorSubject } from 'rxjs';

declare var overwolf: any;
declare var adsReady: any;
declare var OwAd: any;
declare var ga: any;

@Component({
	selector: 'main-window',
	styleUrls: [
		`../../css/global/components-global.scss`,
		`../../css/component/main-window.component.scss`
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="top {{state.currentApp}}">
			<div class="root">
				<div class="app-container {{state.currentApp}}">
					<section class="menu-bar">
						<div class="first">
							<real-time-notifications></real-time-notifications>
							<div class="navigation">
								<i class="i-117X33 gold-theme logo">
									<svg class="svg-icon-fill">
										<use xlink:href="/Files/assets/svg/sprite.svg#logo"/>
									</svg>
								</i>
								<menu-selection [selectedModule]="state.currentApp"></menu-selection>
							</div>
						</div>
						<hotkey></hotkey>
						<div class="controls">
							<control-settings [windowId]="windowId"></control-settings>
							<button class="i-30 pink-button" (click)="goHome()">
								<svg class="svg-icon-fill">
									<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_home"></use>
								</svg>
							</button>
							<control-help></control-help>
							<control-minimize [windowId]="windowId" [isMainWindow]="true"></control-minimize>
							<control-close [windowId]="windowId" [isMainWindow]="true"></control-close>
						</div>
					</section>
					<section class="content-container">
						<collection #collection class="main-section"
								[state]="state.binder"
								[hidden]="state.currentApp !== 'collection'">						
						</collection>
						<achievements #achievements class="main-section"
								[state]="state.achievements"
								[socialShareUserInfo]="state.socialShareUserInfo"
								[hidden]="state.currentApp !== 'achievements'">
						</achievements>
						<decktracker class="main-section" 
								[hidden]="state.currentApp !== 'decktracker'">
						</decktracker>
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
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainWindowComponent implements AfterViewInit {

	@ViewChild('collection')
	private collection: CollectionComponent;
	@ViewChild('achievements')
	private achievements: AchievementsComponent;

	state: MainWindowState;
	windowId: string;
	
	private adRef;
	private adInit = false;

	constructor(
			private cdr: ChangeDetectorRef,
			private debug: DebugService) {
		this.cdr.detach();
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
			}
		});

		overwolf.windows.onStateChanged.addListener((message) => {
			if (message.window_name != "CollectionWindow") {
				return;
			}
			// console.log('state changed CollectionWindow', message);
			if (message.window_state != 'normal') {
				console.log('removing ad', message.window_state);
				this.removeAds();
			}
			else {
				console.log('refreshing ad', message.window_state);
				this.refreshAds();
			}
		});
	}

	ngAfterViewInit() {
		const storeBus: BehaviorSubject<MainWindowState> = overwolf.windows.getMainWindow().mainWindowStore;
		console.log('retrieved storeBus', storeBus, overwolf.windows.getMainWindow());
		storeBus.subscribe((newState: MainWindowState) => {
			setTimeout(() => {
                overwolf.windows.getCurrentWindow((result) => {
                    const currentlyVisible = result.window.isVisible;
                    if (newState.isVisible && (!this.state || !this.state.isVisible || !currentlyVisible)) {
                        overwolf.windows.restore(this.windowId);
                    }
                    console.log('got new state', newState);
                    this.state = newState;
                    if (!(<ViewRef>this.cdr).destroyed) {
                        this.cdr.detectChanges();
                    }
                });
            });
		});
		this.refreshAds();
		ga('send', 'event', 'collection', 'show');
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
			overwolf.windows.getCurrentWindow((currentWindoResult) => {
				// console.log('current window', currentWindoResult);
				const center = {
					x: currentWindoResult.window.left + currentWindoResult.window.width / 2,
					y: currentWindoResult.window.top + currentWindoResult.window.height / 2
				};
				// console.log('center is', center);
				overwolf.windows.sendMessage(result.window.id, 'move', center, (result3) => {
					overwolf.windows.restore(result.window.id, (result2) => {
						overwolf.windows.hide(this.windowId);
					});
				});
			});
		});
	};

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
						this.adRef.addEventListener('impression', (data) => {
							ga('send', 'event', 'ad', 'main-window');
						})
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
