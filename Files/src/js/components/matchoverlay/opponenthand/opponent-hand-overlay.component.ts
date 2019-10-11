import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Subscription } from 'rxjs';
import { GameState } from '../../../models/decktracker/game-state';
import { Preferences } from '../../../models/preferences';
import { DebugService } from '../../../services/debug.service';
import { DeckEvents } from '../../../services/decktracker/event-parser/deck-events';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

@Component({
	selector: 'opponent-hand-overlay',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/matchoverlay/opponenthand/opponent-hand-overlay.component.scss',
	],
	template: `
		<div class="opponent-hand-overlay overlay-container-parent">
			<opponent-card-infos
				[cards]="gameState.opponentDeck.hand"
				[displayTurnNumber]="displayTurnNumber"
				[displayGuess]="displayGuess"
				*ngIf="gameState && gameState.opponentDeck"
			></opponent-card-infos>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class OpponentHandOverlayComponent implements AfterViewInit, OnDestroy {
	gameState: GameState;
	windowId: string;
	displayTurnNumber: boolean = true;
	displayGuess: boolean = true;

	private displayFromPrefs = false;

	private gameInfoUpdatedListener: (message: any) => void;
	private deckSubscription: Subscription;
	private preferencesSubscription: Subscription;
	private displaySubscription: Subscription;

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
			this.gameState = event.state;
			if (event.event.name === DeckEvents.MATCH_METADATA) {
				this.changeWindowSize();
			}
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});
		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe(event => {
			if (event.name === PreferencesService.DECKTRACKER_MATCH_OVERLAY_DISPLAY) {
				this.setDisplayPreferences(event.preferences);
				this.handleDisplayPreferences();
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			}
		});
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				this.logger.debug('[decktracker-overlay] received new game info', res);
				await this.changeWindowSize();
			}
		});

		if (process.env.NODE_ENV !== 'production') {
			console.error('Should not allow debug game state from production');
			this.gameState = this.ow.getMainWindow().deckDebug.state;
		}
		this.setDisplayPreferences(await this.prefs.getPreferences());
		await this.handleDisplayPreferences();
		await this.changeWindowSize();
		// await this.changeWindowPosition();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		console.log('handled after view init');
	}

	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.deckSubscription.unsubscribe();
		this.preferencesSubscription.unsubscribe();
		this.displaySubscription.unsubscribe();
	}

	private setDisplayPreferences(preferences: Preferences) {
		this.displayTurnNumber = preferences.dectrackerShowOpponentTurnDraw;
		this.displayGuess = preferences.dectrackerShowOpponentGuess;
		this.displayFromPrefs = this.displayTurnNumber || this.displayGuess;
	}

	private async handleDisplayPreferences() {
		if (this.displayFromPrefs) {
			this.restoreWindow();
		} else {
			this.hideWindow();
		}
	}

	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		// Window takes 30% of the size of the screen width
		const gameWidth = gameInfo.width;
		const width = gameWidth * 1;
		this.logger.debug(
			'[opponent-hand-overlay] new game width is',
			gameWidth,
			'with dpi',
			'and overlay width',
			width,
			gameInfo,
		);
		// Height
		const gameHeight = gameInfo.height;
		const height = gameHeight * 0.2;
		await this.ow.changeWindowSize(this.windowId, width, height);
	}

	private async restoreWindow() {
		await this.ow.restoreWindow(this.windowId);
	}

	private hideWindow() {
		this.ow.hideWindow(this.windowId);
	}
}
