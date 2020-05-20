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
				*ngIf="gameState && gameState.opponentDeck"
				[cards]="gameState.opponentDeck.hand"
				[displayTurnNumber]="displayTurnNumber"
				[displayGuess]="displayGuess"
				[displayBuff]="displayBuff"
				[maxBuffsToShow]="maxBuffsToShow"
			></opponent-card-infos>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class OpponentHandOverlayComponent implements AfterViewInit, OnDestroy {
	gameState: GameState;
	windowId: string;
	displayTurnNumber = true;
	displayGuess = true;
	displayBuff = true;
	maxBuffsToShow = 0;

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
		// this.cdr.detach();

		this.windowId = (await this.ow.getCurrentWindow()).id;
		const deckEventBus: EventEmitter<any> = this.ow.getMainWindow().deckEventBus;
		this.deckSubscription = deckEventBus.subscribe(async event => {
			// Can happen because we now have a BehaviorSubject
			if (event == null) {
				return;
			}
			this.gameState = event.state;
			// console.log('received state', event.state);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe(event => {
			this.setDisplayPreferences(event.preferences);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				this.logger.debug('[decktracker-overlay] received new game info', res);
				await this.changeWindowSize();
			}
		});
		this.setDisplayPreferences(await this.prefs.getPreferences());
		await this.changeWindowSize();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		// console.log('handled after view init');
	}

	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.deckSubscription.unsubscribe();
		this.preferencesSubscription.unsubscribe();
	}

	private setDisplayPreferences(preferences: Preferences) {
		this.displayTurnNumber = preferences.dectrackerShowOpponentTurnDraw;
		this.displayGuess = preferences.dectrackerShowOpponentGuess;
		this.displayBuff = preferences.dectrackerShowOpponentBuff;
		this.maxBuffsToShow = preferences.dectrackerLimitOpponentBuff
			? preferences.dectrackerMaxOpponentsBuffToShow
			: 0;
		// console.log('maxBuffsToShow', this.maxBuffsToShow, this.displayBuff);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
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
}
