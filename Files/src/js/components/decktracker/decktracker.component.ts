import { Component, AfterViewInit, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, HostListener } from '@angular/core';

import { DebugService } from '../../services/debug.service';
import { GameState } from '../../models/decktracker/game-state';
import { DeckEvents } from '../../services/decktracker/event-parser/deck-events';

declare var overwolf: any;

@Component({
	selector: 'decktracker',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/decktracker.component.scss',
	],
	template: `
		<div class="root">
			<div class="decktracker" *ngIf="gameState">
				<decktracker-title-bar></decktracker-title-bar>
				<decktracker-deck-name [deckName]="gameState.playerDeck.name"></decktracker-deck-name>
				<decktracker-deck-list [deckState]="gameState.playerDeck"></decktracker-deck-list>
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
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerComponent implements AfterViewInit {

	gameState: GameState;

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
		// We get the changes via event updates, so automated changed detection isn't useful in PUSH mode
		this.cdr.detach();
		const deckEventBus: EventEmitter<any> = overwolf.windows.getMainWindow().deckEventBus;
		deckEventBus.subscribe((event) => {
			console.log('received deck event', event);
			this.gameState = event.state;
			this.processEvent(event.event);
			this.cdr.detectChanges();
		})
		console.warn("Should remove the restoreWindow from prod code");
		this.restoreWindow();
		this.gameState = overwolf.windows.getMainWindow().state;
	}

	@HostListener('mousedown')
	dragMove() {
		overwolf.windows.dragMove(this.windowId);
	};

	private processEvent(event) {
		switch(event.name) {
			case DeckEvents.GAME_START:
				// TODO: handle settings based on game mode here
				this.restoreWindow();
				break;
			case DeckEvents.GAME_END:
				this.hideWindow();
				break;
		}
	}

	private restoreWindow() {
		overwolf.windows.restore(this.windowId, (result) => {
			// let wrapper = this.elRef.nativeElement.querySelector('.decktracker');
			// let height = wrapper.getBoundingClientRect().height + 20;
			let width = 270;
			overwolf.games.getRunningGameInfo((gameInfo) => {
				if (!gameInfo) {
					return;
				}
				let gameWidth = gameInfo.logicalWidth;
				let gameHeight = gameInfo.logicalHeight;
				let dpi = gameWidth / gameInfo.width;
				console.log('computed stuff', gameWidth, gameHeight, dpi);
				overwolf.windows.changeSize(this.windowId, width, gameHeight, (changeSize) => {
					// https://stackoverflow.com/questions/8388440/converting-a-double-to-an-int-in-javascript-without-rounding
					let newLeft = ~~(gameWidth - width * dpi);
					let newTop = 0;
					console.log('changing position', newLeft, newTop, width, gameHeight, changeSize);
					overwolf.windows.changePosition(this.windowId, newLeft, newTop, (changePosition) => {
						console.log('changed window position', changePosition);
					});
				});
			});
		});
	}

	private hideWindow() {
		overwolf.windows.hide(this.windowId, (result) => {
		})
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