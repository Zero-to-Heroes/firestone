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
import { BehaviorSubject, Subscriber, Subscription } from 'rxjs';
import { DeckCard } from '../../../models/decktracker/deck-card';
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
				*ngIf="shouldShow"
				[cards]="hand"
				[displayTurnNumber]="displayTurnNumber"
				[displayGuess]="displayGuess"
				[displayBuff]="displayBuff"
			></opponent-card-infos>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class OpponentHandOverlayComponent implements AfterViewInit, OnDestroy {
	// gameState: GameState;
	windowId: string;
	shouldShow: boolean;
	hand: readonly DeckCard[];
	displayTurnNumber = true;
	displayGuess = true;
	displayBuff = true;

	private gameInfoUpdatedListener: (message: any) => void;
	private deckSubscription: Subscription;
	private preferencesSubscription: Subscription;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private init_DebugService: DebugService,
	) {}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;

		const deckEventBus: BehaviorSubject<any> = this.ow.getMainWindow().deckEventBus;
		const subscriber = new Subscriber<any>(async (event) => {
			// Can happen because we now have a BehaviorSubject
			if (event == null) {
				return;
			}
			this.shouldShow = event.state && (event.state as GameState).opponentDeck != null;
			this.hand = (event.state as GameState).opponentDeck?.hand;
			// this.gameState = event.state;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		subscriber['identifier'] = 'opponent-hand-overlay';
		this.deckSubscription = deckEventBus.subscribe(subscriber);

		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe((event) => {
			this.setDisplayPreferences(event.preferences);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				await this.changeWindowSize();
			}
		});
		this.setDisplayPreferences(await this.prefs.getPreferences());
		await this.changeWindowSize();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.deckSubscription?.unsubscribe();
		this.preferencesSubscription?.unsubscribe();
	}

	private setDisplayPreferences(preferences: Preferences) {
		if (!preferences) {
			return;
		}

		this.displayTurnNumber = preferences.dectrackerShowOpponentTurnDraw;
		this.displayGuess = preferences.dectrackerShowOpponentGuess;
		this.displayBuff = preferences.dectrackerShowOpponentBuffInHand;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.width;
		const gameHeight = gameInfo.height;
		const height = gameHeight * 0.8;
		const width = gameHeight;
		await this.ow.changeWindowSize(this.windowId, width, height);
		const dpi = gameInfo.logicalWidth / gameInfo.width;
		const newLeft = dpi * 0.5 * (gameWidth - width);
		await this.ow.changeWindowPosition(this.windowId, newLeft, 0);
	}
}
