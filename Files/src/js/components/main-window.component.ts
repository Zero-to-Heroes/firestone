import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MainWindowState } from '../models/mainwindow/main-window-state';
import { AdService } from '../services/ad.service';
import { DebugService } from '../services/debug.service';
import { OverwolfService } from '../services/overwolf.service';

declare var adsReady: any;
declare var OwAd: any;
declare var ga: any;

@Component({
	selector: 'main-window',
	styleUrls: [`../../css/global/components-global.scss`, `../../css/component/main-window.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="top {{ state.currentApp }}" *ngIf="state">
			<div class="root">
				<div class="app-container {{ state.currentApp }}">
					<section class="menu-bar">
						<main-window-navigation [navigation]="state.navigation"></main-window-navigation>
						<div class="first">
							<real-time-notifications></real-time-notifications>
							<div class="navigation">
								<i class="i-117X33 gold-theme logo">
									<svg class="svg-icon-fill">
										<use xlink:href="/Files/assets/svg/sprite.svg#logo" />
									</svg>
								</i>
								<menu-selection [selectedModule]="state.currentApp"></menu-selection>
							</div>
						</div>
						<hotkey></hotkey>
						<div class="controls">
							<control-bug></control-bug>
							<control-settings [windowId]="windowId" [settingsApp]="state.currentApp"></control-settings>
							<button class="i-30 pink-button" (mousedown)="goHome()">
								<svg class="svg-icon-fill">
									<use
										xmlns:xlink="http://www.w3.org/1999/xlink"
										xlink:href="/Files/assets/svg/sprite.svg#window-control_home"
									></use>
								</svg>
							</button>
							<control-discord></control-discord>
							<control-minimize [windowId]="windowId" [isMainWindow]="true"></control-minimize>
							<control-maximize [windowId]="windowId"></control-maximize>
							<control-close [windowId]="windowId" [isMainWindow]="true" [closeAll]="true"></control-close>
						</div>
					</section>
					<section class="content-container">
						<collection class="main-section" [state]="state.binder" [hidden]="state.currentApp !== 'collection'"></collection>
						<achievements
							class="main-section"
							[state]="state.achievements"
							[socialShareUserInfo]="state.socialShareUserInfo"
							[hidden]="state.currentApp !== 'achievements'"
						>
						</achievements>
						<decktracker class="main-section" [hidden]="state.currentApp !== 'decktracker'"> </decktracker>
					</section>
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
				<tooltips></tooltips>
			</div>
			<div class="ads-container">
				<div class="no-ads-placeholder">
					<i class="i-117X33 gold-theme logo">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#ad_placeholder" />
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
	state: MainWindowState;
	windowId: string;

	private isMaximized = false;
	private adRef;
	private adInit = false;

	constructor(private cdr: ChangeDetectorRef, private adService: AdService, private ow: OverwolfService, private debug: DebugService) {}

	async ngAfterViewInit() {
		this.cdr.detach();
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.ow.addMessageReceivedListener(async message => {
			if (message.id === 'move') {
				const window = await this.ow.getCurrentWindow();
				const newX = message.content.x - window.width / 2;
				const newY = message.content.y - window.height / 2;
				this.ow.changeWindowPosition(this.windowId, newX, newY);
			}
		});
		this.ow.addStateChangedListener('CollectionWindow', message => {
			if (message.window_state === 'maximized') {
				this.isMaximized = true;
			} else {
				this.isMaximized = false;
			}
			if (message.window_state !== 'normal' && message.window_state !== 'maximized') {
				console.log('removing ad', message.window_state);
				this.removeAds();
			} else if (message.window_previous_state !== 'normal' && message.window_previous_state !== 'maximized') {
				console.log('refreshing ad', message.window_state, message);
				this.refreshAds();
			}
		});
		const storeBus: BehaviorSubject<MainWindowState> = this.ow.getMainWindow().mainWindowStore;
		console.log('retrieved storeBus', storeBus);
		storeBus.subscribe((newState: MainWindowState) => {
			setTimeout(async () => {
				const window = await this.ow.getCurrentWindow();
				const currentlyVisible = window.isVisible;
				if (newState.isVisible && (!this.state || !this.state.isVisible || !currentlyVisible)) {
					await this.ow.restoreWindow(this.windowId);
				}
				console.log('updated state after event');
				this.state = newState;
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			});
		});
		this.refreshAds();
		ga('send', 'event', 'collection', 'show');
	}

	@HostListener('mousedown')
	dragMove() {
		if (!this.isMaximized) {
			this.ow.dragMove(this.windowId);
		}
	}

	async goHome() {
		const welcomeWindow = await this.ow.obtainDeclaredWindow('WelcomeWindow');
		const window = await this.ow.getCurrentWindow();
		const center = {
			x: window.left + window.width / 2,
			y: window.top + window.height / 2,
		};
		await this.ow.sendMessage(welcomeWindow.id, 'move', center);
		await this.ow.restoreWindow(welcomeWindow.id);
		await this.ow.hideWindow(this.windowId);
	}

	private async refreshAds() {
		const shouldDisplayAds = await this.adService.shouldDisplayAds();
		if (!shouldDisplayAds) {
			console.log('ad-free app, not showing ads and returning');
			return;
		}
		if (this.adInit) {
			console.log('already initializing ads, returning');
			return;
		}
		if (!adsReady || !OwAd) {
			console.log('ads container not ready, returning');
			setTimeout(() => {
				this.refreshAds();
			}, 50);
			return;
		}
		if (!document.getElementById('ad-div')) {
			console.log('ad-div not ready, returning');
			setTimeout(() => {
				this.refreshAds();
			}, 50);
			return;
		}
		if (!this.adRef) {
			this.adInit = true;
			const window = await this.ow.getCurrentWindow();
			if (window.isVisible) {
				console.log('first time init ads, creating OwAd');
				this.adRef = new OwAd(document.getElementById('ad-div'));
				this.adRef.addEventListener('impression', data => {
					ga('send', 'event', 'ad', 'loading-window');
				});
				console.log('init OwAd');
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			}
			this.adInit = false;
			this.refreshAds();
			return;
		}
		console.log('refreshing ads');
		this.adRef.refreshAd();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private removeAds() {
		if (!this.adRef) {
			return;
		}
		console.log('removing ads');
		this.adRef.removeAd();
	}
}
