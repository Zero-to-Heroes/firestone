import { Component, AfterViewInit, ElementRef, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef, EventEmitter } from '@angular/core';

import { DebugService } from '../../services/debug.service';
import { GameStateService } from '../../services/decktracker/game-state.service';

declare var overwolf: any;

@Component({
	selector: 'decktracker',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/decktracker.component.scss',
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="decktracker">
		
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerComponent implements AfterViewInit {

	private windowId: string;

	constructor(
			private cdr: ChangeDetectorRef,
			private debugService: DebugService,
			private elRef: ElementRef) {
		overwolf.windows.getCurrentWindow((result) => {
			this.windowId = result.window.id;
		});
		overwolf.games.onGameInfoUpdated.addListener((res: any) => {
			if (this.exitGame(res)) {
				this.closeApp();
			}
		});
	}

	ngAfterViewInit() {
		// Add event listener for game start - restore the window
		const deckEventBus: EventEmitter<any> = overwolf.windows.getMainWindow().deckEventBus;
		deckEventBus.subscribe((event) => {
			const newState = event.state;
			const eventName = event.event.name;
			console.log('received deck event', newState, eventName);
		})

		// Add event listener for game end - to minimize / close the window
	}

	private resize() {
		setTimeout(() => {
			let wrapper = this.elRef.nativeElement.querySelector('.simple-notification-wrapper');
			let height = wrapper.getBoundingClientRect().height + 20;
			let width = 500;
			// console.log('resizing, current window');
			// console.log('rect2', wrapper.getBoundingClientRect());
			overwolf.games.getRunningGameInfo((gameInfo) => {
				if (!gameInfo) {
					return;
				}
				let gameWidth = gameInfo.logicalWidth;
				let gameHeight = gameInfo.logicalHeight;
				let dpi = gameWidth / gameInfo.width;
				// console.log('logical info', gameWidth, gameHeight, dpi);
				overwolf.windows.changeSize(this.windowId, width, height, (changeSize) => {
					// console.log('changed window size');
					// https://stackoverflow.com/questions/8388440/converting-a-double-to-an-int-in-javascript-without-rounding
					let newLeft = ~~(gameWidth - width * dpi);
					let newTop = ~~(gameHeight - height * dpi - 10);
					// console.log('changing position', newLeft, newTop, width, height);
					overwolf.windows.changePosition(this.windowId, newLeft, newTop, (changePosition) => {
						// console.log('changed window position');
					});
				});
			});
		});
	}

	private exitGame(gameInfoResult: any): boolean {
		return (!gameInfoResult || !gameInfoResult.gameInfo || !gameInfoResult.gameInfo.isRunning);
	}

	private closeApp() {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success") {
				console.log('closing');
				overwolf.windows.close(result.window.id);
			}
		});
	}
}