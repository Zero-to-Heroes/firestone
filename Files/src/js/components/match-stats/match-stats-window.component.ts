import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { MatchStatsState } from '../../models/mainwindow/stats/match-stats-state';
import { AdService } from '../../services/ad.service';
import { DebugService } from '../../services/debug.service';
import { OverwolfService } from '../../services/overwolf.service';

declare var adsReady: any;
declare var OwAd: any;
declare var ga: any;

@Component({
	selector: 'match-stats-window',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/match-stats/match-stats-window.component.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="top" *ngIf="state">
			<div class="root">
				<div class="app-container">
					<div class="title">Match Summary</div>
					<div class="content-container">
						<match-stats-menu [selectedMenu]="state.currentStat"></match-stats-menu>
						<div class="main-zone">
							<game-replay
								[ngClass]="{ 'active': state.currentStat === 'replay' }"
								[replayKey]="state.matchStats ? state.matchStats.replayKey : undefined"
								[reviewId]="state.matchStats ? state.matchStats.reviewId : undefined"
							></game-replay>
						</div>
					</div>
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
export class MatchStatsWindowComponent implements AfterViewInit, OnDestroy {
	state: MatchStatsState;
	windowId: string;

	private isMaximized = false;
	private adRef;
	private adInit = false;
	private shouldDisplayAds = true;
	private stateChangedListener: (message: any) => void;
	private impressionListener: (message: any) => void;
	private storeSubscription: Subscription;

	constructor(
		private cdr: ChangeDetectorRef,
		private adService: AdService,
		private ow: OverwolfService,
		private debug: DebugService,
	) {}

	async ngAfterViewInit() {
		this.cdr.detach();
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.stateChangedListener = this.ow.addStateChangedListener('MatchStatsWindow', message => {
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
		console.log('retrieved storeBus');
		this.storeSubscription = storeBus.subscribe(async (event: MainWindowState) => {
			const newState = event.matchStats;
			const window = await this.ow.getCurrentWindow();
			const currentlyVisible = window.isVisible;
			if (newState.visible && !currentlyVisible) {
				await this.ow.restoreWindow(this.windowId);
			} else if (!newState.visible && currentlyVisible) {
				await this.ow.hideWindow(this.windowId);
			}
			console.log('updated state after event', newState);
			this.state = newState;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});
		this.shouldDisplayAds = await this.adService.shouldDisplayAds();
		this.refreshAds();
		ga('send', 'event', 'collection', 'show');
	}

	@HostListener('mousedown')
	dragMove() {
		if (!this.isMaximized) {
			this.ow.dragMove(this.windowId);
		}
	}

	ngOnDestroy(): void {
		this.ow.removeStateChangedListener(this.stateChangedListener);
		this.adRef.removeEventListener(this.impressionListener);
		this.storeSubscription.unsubscribe();
	}

	private async refreshAds() {
		console.log('[main-window] refreshing ads');
		if (!this.shouldDisplayAds) {
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
			}, 1000);
			return;
		}
		if (!document.getElementById('ad-div')) {
			console.log('ad-div not ready, returning');
			setTimeout(() => {
				this.refreshAds();
			}, 1000);
			return;
		}
		if (!this.adRef) {
			if (this.impressionListener) {
				console.warn(
					'[main-window] Redefining the impression listener, could cause memory leaks',
					this.impressionListener,
				);
			}
			this.adInit = true;
			const window = await this.ow.getCurrentWindow();
			if (window.isVisible) {
				console.log('first time init ads, creating OwAd');
				this.adRef = new OwAd(document.getElementById('ad-div'), { width: 300, height: 250 });
				this.impressionListener = data => {
					ga('send', 'event', 'ad', 'loading-window');
				};
				this.adRef.addEventListener('impression', this.impressionListener);
				console.log('init OwAd');
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			}
			this.adInit = false;
			setTimeout(() => {
				this.refreshAds();
			}, 1000);
			return;
		}
		console.log('[main-window] refreshed ads');
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
