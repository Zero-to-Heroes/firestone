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
import { MainWindowState } from '../models/mainwindow/main-window-state';
import { DebugService } from '../services/debug.service';
import { OverwolfService } from '../services/overwolf.service';

declare var amplitude: any;

@Component({
	selector: 'main-window',
	styleUrls: [`../../css/global/components-global.scss`, `../../css/component/main-window.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<window-wrapper *ngIf="state" [activeTheme]="state.currentApp">
			<section class="menu-bar">
				<!-- <main-window-navigation [navigation]="state.navigation"></main-window-navigation> -->
				<div class="first">
					<div class="navigation">
						<i class="i-117X33 gold-theme logo">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#logo" />
							</svg>
						</i>
						<menu-selection
							[selectedModule]="state.currentApp"
							[currentUser]="state.currentUser"
						></menu-selection>
					</div>
				</div>
				<hotkey></hotkey>
				<div class="controls">
					<control-bug></control-bug>
					<control-settings [windowId]="windowId" [settingsApp]="state.currentApp"></control-settings>
					<control-discord></control-discord>
					<control-minimize [windowId]="windowId" [isMainWindow]="true"></control-minimize>
					<control-maximize [windowId]="windowId"></control-maximize>
					<control-close [windowId]="windowId" [isMainWindow]="true" [closeAll]="true"></control-close>
				</div>
			</section>
			<section class="content-container">
				<replays
					class="main-section"
					[state]="state.replays"
					[navigation]="state.navigation"
					[hidden]="state.currentApp !== 'replays'"
				></replays>
				<achievements
					class="main-section"
					[state]="state.achievements"
					[navigation]="state.navigation"
					[currentUser]="state.currentUser"
					[socialShareUserInfo]="state.socialShareUserInfo"
					[hidden]="state.currentApp !== 'achievements'"
					[globalStats]="state.globalStats"
				>
				</achievements>
				<collection
					class="main-section"
					[state]="state.binder"
					[navigation]="state.navigation"
					[hidden]="state.currentApp !== 'collection'"
				></collection>
				<decktracker
					class="main-section"
					[state]="state.decktracker"
					[navigation]="state.navigation"
					[hidden]="state.currentApp !== 'decktracker'"
				>
				</decktracker>
			</section>
			<tooltips></tooltips>
			<ads [parentComponent]="'main-window'"></ads>
		</window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainWindowComponent implements AfterViewInit, OnDestroy {
	state: MainWindowState;
	windowId: string;

	private isMaximized = false;
	private stateChangedListener: (message: any) => void;
	private messageReceivedListener: (message: any) => void;
	private storeSubscription: Subscription;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly debug: DebugService,
	) {}

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
		this.stateChangedListener = this.ow.addStateChangedListener('CollectionWindow', message => {
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
		this.storeSubscription = storeBus.subscribe((newState: MainWindowState) => {
			setTimeout(async () => {
				const window = await this.ow.getCurrentWindow();
				const currentlyVisible = window.isVisible;
				if (newState.isVisible && (!this.state || !this.state.isVisible || !currentlyVisible)) {
					amplitude.getInstance().logEvent('show', { 'window': 'collection', 'page': newState.currentApp });
					console.log('restoring window', this.isMaximized);
					await this.ow.restoreWindow(this.windowId);
					if (this.isMaximized) {
						await this.ow.maximizeWindow(this.windowId);
					}
				} else if (this.state && newState.currentApp !== this.state.currentApp) {
					amplitude.getInstance().logEvent('show', { 'window': 'collection', 'page': newState.currentApp });
				}
				// console.log('updated state after event');
				this.state = newState;
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			});
		});
	}

	@HostListener('mousedown')
	dragMove() {
		if (!this.isMaximized) {
			this.ow.dragMove(this.windowId);
		}
	}

	ngOnDestroy(): void {
		this.ow.removeStateChangedListener(this.stateChangedListener);
		this.ow.removeMessageReceivedListener(this.messageReceivedListener);
		this.storeSubscription.unsubscribe();
	}
}
