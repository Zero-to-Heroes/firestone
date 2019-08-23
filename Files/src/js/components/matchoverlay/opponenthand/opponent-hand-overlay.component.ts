import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, ViewRef } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Subscription } from 'rxjs';
import { GameState } from '../../../models/decktracker/game-state';
import { DebugService } from '../../../services/debug.service';
import { DeckEvents } from '../../../services/decktracker/event-parser/deck-events';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

@Component({
	selector: 'opponent-hand-overlay',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/matchoverlay/opponenthand/opponent-hand-overlay.component.scss',
	],
	template: `
		<div class="opponent-hand-overlay">
			<opponent-card-infos [cards]="gameState.opponentDeck.hand" *ngIf="gameState && gameState.opponentDeck"></opponent-card-infos>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentHandOverlayComponent implements AfterViewInit, OnDestroy {
	gameState: GameState;
	windowId: string;

	private gameInfoUpdatedListener: (message: any) => void;
	private deckSubscription: Subscription;
	private preferencesSubscription: Subscription;

	constructor(
		private logger: NGXLogger,
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private init_DebugService: DebugService,
	) {}

	async ngAfterViewInit() {
		// We get the changes via event updates, so automated changed detection isn't useful in PUSH mode
		this.cdr.detach();

		this.windowId = (await this.ow.getCurrentWindow()).id;
		const deckEventBus: EventEmitter<any> = this.ow.getMainWindow().deckEventBus;
		this.deckSubscription = deckEventBus.subscribe(async event => {
			// this.logger.debug('received deck event', event.event, event.state);
			this.gameState = event.state;
			await this.processEvent(event.event);
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});
		if (process.env.NODE_ENV !== 'production') {
			console.error('Should not allow debug game state from production');
			this.gameState = this.ow.getMainWindow().deckDebug.state;
			console.log('game state', this.gameState, JSON.stringify(this.gameState));
		}

		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				this.logger.debug('[decktracker-overlay] received new game info', res);
				await this.changeWindowSize();
				await this.changeWindowPosition();
			}
		});
		await this.changeWindowSize();
		await this.changeWindowPosition();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		console.log('handled after view init');
	}

	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.deckSubscription.unsubscribe();
		this.preferencesSubscription.unsubscribe();
	}

	private async processEvent(event) {
		switch (event.name) {
			case DeckEvents.GAME_START:
				console.log('received MATCH_METADATA event');
				this.ow.restoreWindow(this.windowId);
				break;
			case DeckEvents.GAME_END:
				console.log('received GAME_END event');
				this.hideWindow();
				break;
		}
	}

	private async changeWindowPosition(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		// Window takes 30% of the size of the screen width
		const gameWidth = gameInfo.logicalWidth;
		// And the position
		const newLeft = gameWidth * 0.3;
		const newTop = 0;
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
	}

	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		// Window takes 30% of the size of the screen width
		const gameWidth = gameInfo.logicalWidth;
		const dpi = gameWidth / gameInfo.width;
		const width = gameWidth * dpi * 0.4;
		// Height
		const gameHeight = gameInfo.logicalHeight;
		const height = gameHeight * dpi * 0.2;
		await this.ow.changeWindowSize(this.windowId, width, height);
	}

	private hideWindow() {
		this.ow.hideWindow(this.windowId);
	}
}
