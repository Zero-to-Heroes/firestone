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
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CurrentAppType } from '../models/mainwindow/current-app.type';
import { MainWindowState } from '../models/mainwindow/main-window-state';
import { NavigationState } from '../models/mainwindow/navigation/navigation-state';
import { DebugService } from '../services/debug.service';
import { OverwolfService } from '../services/overwolf.service';

declare let amplitude: any;

@Component({
	selector: 'main-window',
	styleUrls: [`../../css/global/components-global.scss`, `../../css/component/main-window.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<window-wrapper
			*ngIf="dataState && navigationState && cardsInitDone"
			[activeTheme]="activeTheme"
			[allowResize]="true"
		>
			<section class="menu-bar" [ngClass]="{ 'ftue': dataState.showFtue }">
				<div class="first">
					<div class="navigation">
						<i class="i-117X33 gold-theme logo">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#logo" />
							</svg>
						</i>
						<menu-selection
							[selectedModule]="navigationState.currentApp"
							[currentUser]="dataState.currentUser"
						></menu-selection>
					</div>
				</div>
				<hotkey></hotkey>
				<div class="controls">
					<control-bug></control-bug>
					<control-settings
						[windowId]="windowId"
						[settingsApp]="navigationState.currentApp"
					></control-settings>
					<control-discord></control-discord>
					<control-minimize [windowId]="windowId" [isMainWindow]="true"></control-minimize>
					<control-maximize [windowId]="windowId"></control-maximize>
					<control-close [windowId]="windowId" [isMainWindow]="true" [closeAll]="true"></control-close>
				</div>
			</section>
			<ftue *ngIf="dataState.showFtue" [selectedModule]="navigationState.currentApp"> </ftue>
			<section class="content-container" *ngIf="!dataState.showFtue">
				<replays
					class="main-section"
					[state]="dataState.replays"
					[navigation]="navigationState"
					[hidden]="navigationState.currentApp !== 'replays'"
				></replays>
				<achievements
					class="main-section"
					[state]="dataState.achievements"
					[navigation]="navigationState"
					[currentUser]="dataState.currentUser"
					[socialShareUserInfo]="dataState.socialShareUserInfo"
					[hidden]="navigationState.currentApp !== 'achievements'"
					[globalStats]="dataState.globalStats"
				>
				</achievements>
				<collection
					class="main-section"
					[state]="dataState.binder"
					[navigation]="navigationState"
					[hidden]="navigationState.currentApp !== 'collection'"
				></collection>
				<decktracker
					class="main-section"
					[state]="dataState.decktracker"
					[navigation]="navigationState"
					[hidden]="navigationState.currentApp !== 'decktracker'"
				>
				</decktracker>
				<battlegrounds-desktop class="main-section" [hidden]="navigationState.currentApp !== 'battlegrounds'">
				</battlegrounds-desktop>
			</section>
			<ads [parentComponent]="'main-window'" *ngIf="!dataState.showFtue"></ads>
		</window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainWindowComponent implements AfterViewInit, OnDestroy {
	dataState: MainWindowState;
	navigationState: NavigationState;
	windowId: string;
	activeTheme: CurrentAppType;
	cardsInitDone: boolean;

	private isMaximized = false;
	private stateChangedListener: (message: any) => void;
	private navigationStateChangedListener: (message: any) => void;
	private messageReceivedListener: (message: any) => void;
	private dataStoreSubscription: Subscription;
	private navigationStoreSubscription: Subscription;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly debug: DebugService,
		private readonly cards: AllCardsService,
	) {
		this.init();
	}

	async ngAfterViewInit() {
		this.cdr.detach();
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.messageReceivedListener = this.ow.addMessageReceivedListener(async message => {
			if (message.id === 'move') {
				const window = await this.ow.getCurrentWindow();
				const newX = message.content.x - window.width / 2;
				const newY = message.content.y - window.height / 2;
				this.ow.changeWindowPosition(this.windowId, newX, newY);
			}
		});
		this.stateChangedListener = this.ow.addStateChangedListener(OverwolfService.COLLECTION_WINDOW, message => {
			console.log('received collection window message', message, this.isMaximized);
			// If hidden, restore window to as it was
			if (message.window_previous_state_ex === 'hidden') {
				console.log('window was previously hidden, keeping the previosu state', this.isMaximized);
			} else if (message.window_state === 'maximized') {
				this.isMaximized = true;
			} else if (message.window_state !== 'minimized') {
				// When minimized we want to remember the last position
				this.isMaximized = false;
			}
		});
		const storeBus: BehaviorSubject<MainWindowState> = this.ow.getMainWindow().mainWindowStore;
		// console.log('retrieved storeBus');
		this.dataStoreSubscription = storeBus.subscribe((newState: MainWindowState) => {
			setTimeout(async () => {
				// First update the state before restoring the window
				// console.log('received state', newState);
				this.dataState = newState;
				this.activeTheme = this.dataState.showFtue ? 'general' : this.navigationState?.currentApp;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
		});
		const navigationStoreBus: BehaviorSubject<NavigationState> = this.ow.getMainWindow().mainWindowStoreNavigation;
		// console.log('retrieved storeBus');
		this.navigationStoreSubscription = navigationStoreBus.subscribe((newState: NavigationState) => {
			setTimeout(async () => {
				// First update the state before restoring the window
				// console.log('received state', newState);
				this.navigationState = newState;
				this.activeTheme = this.dataState?.showFtue ? 'general' : this.navigationState.currentApp;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
				const window = await this.ow.getCurrentWindow();
				const currentlyVisible = window.isVisible;
				if (
					newState.isVisible &&
					(!this.navigationState || !this.navigationState.isVisible || !currentlyVisible)
				) {
					amplitude.getInstance().logEvent('show', { 'window': 'collection', 'page': newState.currentApp });
					console.log('restoring window', this.isMaximized);
					await this.ow.restoreWindow(this.windowId);
					if (this.isMaximized) {
						await this.ow.maximizeWindow(this.windowId);
					}
				} else if (!newState.isVisible && currentlyVisible) {
					console.log('hiding main window', newState);
					await this.ow.hideWindow(this.windowId);
				}
				if (this.navigationState && newState.currentApp !== this.navigationState.currentApp) {
					amplitude.getInstance().logEvent('show', { 'window': 'collection', 'page': newState.currentApp });
				}
			});
		});
	}

	@HostListener('mousedown')
	dragMove() {
		// if (!this.isMaximized) {
		this.ow.dragMove(this.windowId);
		// }
	}

	ngOnDestroy(): void {
		this.ow.removeStateChangedListener(this.stateChangedListener);
		this.ow.removeMessageReceivedListener(this.messageReceivedListener);
		this.dataStoreSubscription.unsubscribe();
	}

	private async init() {
		await this.cards.initializeCardsDb();
		this.cardsInitDone = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
