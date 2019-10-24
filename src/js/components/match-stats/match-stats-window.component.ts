import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { MatchStatsState } from '../../models/mainwindow/stats/match-stats-state';
import { DebugService } from '../../services/debug.service';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { CloseMatchStatsWindowEvent } from '../../services/mainwindow/store/events/stats/close-match-stats-window-event';
import { MaximizeMatchStatsWindowEvent } from '../../services/mainwindow/store/events/stats/maximize-match-stats-window-event';
import { MinimizeMatchStatsWindowEvent } from '../../services/mainwindow/store/events/stats/minimize-match-stats-window-event';
import { OverwolfService } from '../../services/overwolf.service';

declare var amplitude: any;

@Component({
	selector: 'match-stats-window',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/match-stats/match-stats-window.component.scss`,
	],
	template: `
		<window-wrapper *ngIf="state" [activeTheme]="'decktracker'">
			<section class="menu-bar">
				<div class="title">Match Summary (experimental)</div>
				<div class="controls">
					<control-bug></control-bug>
					<control-discord></control-discord>
					<control-minimize [windowId]="windowId" [eventProvider]="minimizeEventProvider"></control-minimize>
					<control-maximize [windowId]="windowId" [eventProvider]="maximizeEventProvider"></control-maximize>
					<control-close [windowId]="windowId" [eventProvider]="closeEventProvider"></control-close>
				</div>
			</section>
			<div class="content-container">
				<match-stats-menu [selectedMenu]="state.currentStat"></match-stats-menu>
				<div class="main-zone">
					<game-replay
						[ngClass]="{ 'active': state.currentStat === 'replay' }"
						[replayKey]="state.matchStats ? state.matchStats.replayKey : undefined"
						[reviewId]="state.matchStats ? state.matchStats.reviewId : undefined"
					></game-replay>
					<match-overview
						[ngClass]="{ 'active': state.currentStat === 'overview' }"
						[stats]="state.matchStats"
					>
					</match-overview>
				</div>
			</div>
			<tooltips></tooltips>
			<ads [parentComponent]="'match-stats'"></ads>
		</window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchStatsWindowComponent implements AfterViewInit, OnDestroy {
	state: MatchStatsState;
	windowId: string;

	closeEventProvider: () => MainWindowStoreEvent;
	minimizeEventProvider: () => MainWindowStoreEvent;
	maximizeEventProvider: () => MainWindowStoreEvent;

	private isMaximized = false;
	private stateChangedListener: (message: any) => void;
	private storeSubscription: Subscription;

	constructor(private cdr: ChangeDetectorRef, private ow: OverwolfService, private debug: DebugService) {}

	async ngAfterViewInit() {
		this.cdr.detach();
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.stateChangedListener = this.ow.addStateChangedListener('MatchStatsWindow', message => {
			if (message.window_state === 'maximized') {
				this.isMaximized = true;
			} else {
				this.isMaximized = false;
			}
		});
		const storeBus: BehaviorSubject<MainWindowState> = this.ow.getMainWindow().mainWindowStore;
		console.log('retrieved storeBus');
		this.storeSubscription = storeBus.subscribe(async (event: MainWindowState) => {
			const newState = event.matchStats;
			const window = await this.ow.getCurrentWindow();
			const currentlyVisible = window.isVisible;
			if (newState.visible) {
				if (!currentlyVisible) {
					await this.ow.restoreWindow(this.windowId);
					amplitude.getInstance().logEvent('show', { 'page': 'match-stats' });
				}
				if (newState.minimized) {
					await this.ow.minimizeWindow(this.windowId);
				} else if (newState.maximized) {
					await this.ow.maximizeWindow(this.windowId);
				} else if (this.state && this.state.maximized) {
					// Redimension window
					await this.ow.restoreWindow(this.windowId);
				}
			} else if (!newState.visible && currentlyVisible) {
				await this.ow.hideWindow(this.windowId);
			}
			console.log('updated state after event', newState);
			this.state = newState;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});
		this.closeEventProvider = () => new CloseMatchStatsWindowEvent();
		this.minimizeEventProvider = () => new MinimizeMatchStatsWindowEvent();
		this.maximizeEventProvider = () => new MaximizeMatchStatsWindowEvent();
	}

	@HostListener('mousedown')
	dragMove() {
		if (!this.isMaximized) {
			this.ow.dragMove(this.windowId);
		}
	}

	ngOnDestroy(): void {
		this.ow.removeStateChangedListener(this.stateChangedListener);
		this.storeSubscription.unsubscribe();
	}
}
