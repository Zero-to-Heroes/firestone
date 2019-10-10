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

declare var ga: any;

@Component({
	selector: 'main-window',
	styleUrls: [
		`../../css/global/components-global.scss`,
		`../../css/component/main-window.component.scss`,
		`../../css/themes/collection-theme.scss`,
		`../../css/themes/achievements-theme.scss`,
		`../../css/themes/decktracker-theme.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="top {{ state.currentApp }}" *ngIf="state" [activeTheme]="state.currentApp">
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
							<control-discord></control-discord>
							<control-minimize [windowId]="windowId" [isMainWindow]="true"></control-minimize>
							<control-maximize [windowId]="windowId"></control-maximize>
							<control-close
								[windowId]="windowId"
								[isMainWindow]="true"
								[closeAll]="true"
							></control-close>
						</div>
					</section>
					<section class="content-container">
						<collection
							class="main-section"
							[state]="state.binder"
							[hidden]="state.currentApp !== 'collection'"
						></collection>
						<achievements
							class="main-section"
							[state]="state.achievements"
							[currentUser]="state.currentUser"
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
			<ads [parentComponent]="'main-window'"></ads>
		</div>
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
			if (message.window_state === 'maximized') {
				this.isMaximized = true;
			} else {
				this.isMaximized = false;
			}
		});
		const storeBus: BehaviorSubject<MainWindowState> = this.ow.getMainWindow().mainWindowStore;
		console.log('retrieved storeBus');
		this.storeSubscription = storeBus.subscribe((newState: MainWindowState) => {
			setTimeout(async () => {
				const window = await this.ow.getCurrentWindow();
				const currentlyVisible = window.isVisible;
				if (newState.isVisible && (!this.state || !this.state.isVisible || !currentlyVisible)) {
					ga('send', 'event', 'collection', 'show');
					await this.ow.restoreWindow(this.windowId);
				}
				console.log('updated state after event');
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
