import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject, Subscriber, Subscription } from 'rxjs';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { GameState } from '../../../models/decktracker/game-state';
import { Preferences } from '../../../models/preferences';
import { DebugService } from '../../../services/debug.service';
import { FeatureFlags } from '../../../services/feature-flags';
import { CARDS_VERSION } from '../../../services/hs-utils';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

@Component({
	selector: 'battlegrounds-mouse-over-overlay',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/battlegrounds/overlay/battlegrounds-mouse-over-overlay.component.scss',
	],
	template: `
		<div class="battlegrounds-mouse-over-overlay overlay-container-parent" *ngIf="inGame">
			<ul class="bgs-leaderboard">
				<bgs-leaderboard-empty-card
					class="opponent-overlay"
					*ngFor="let bgsPlayer of bgsPlayers; let i = index; trackBy: trackByFunction"
					[bgsPlayer]="bgsPlayer"
					[currentTurn]="currentTurn"
					[lastOpponentCardId]="lastOpponentCardId"
					[showLastOpponentIcon]="showLastOpponentIcon"
					position="global-top-left"
				>
				</bgs-leaderboard-empty-card>
			</ul>
			<div class="board-container top-board">
				<ul class="board">
					<bgs-tavern-minion
						class="tavern-minion"
						*ngFor="let minion of minions; let i = index; trackBy: trackByMinion"
						[minion]="minion"
						[showTribesHighlight]="showTribesHighlight"
						[highlightedTribes]="highlightedTribes"
						[highlightedMinions]="highlightedMinions"
					></bgs-tavern-minion>
				</ul>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class BattlegroundsMouseOverOverlayComponent implements AfterViewInit, OnDestroy {
	windowId: string;

	// state: BattlegroundsState;
	inGame: boolean;
	tavernBoard: readonly DeckCard[];
	bgsPlayers: readonly BgsPlayer[];
	lastOpponentCardId: string;
	currentTurn: number;
	phase: 'combat' | 'recruit';
	minions: readonly DeckCard[];
	highlightedTribes: readonly Race[];
	highlightedMinions: readonly string[];
	showLastOpponentIcon: boolean;
	showTribesHighlight: boolean;

	private gameInfoUpdatedListener: (message: any) => void;
	private deckSubscription: Subscription;
	private preferencesSubscription: Subscription;
	private storeSubscription: Subscription;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private init_DebugService: DebugService,
		private allCards: AllCardsService,
	) {
		allCards.initializeCardsDb(CARDS_VERSION);
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.ow.setWindowPassthrough(this.windowId);

		const storeBus: BehaviorSubject<BattlegroundsState> = this.ow.getMainWindow().battlegroundsStore;
		this.storeSubscription = storeBus.subscribe((newState: BattlegroundsState) => {
			this.inGame = newState && newState.inGame && !newState.currentGame?.gameEnded;
			this.bgsPlayers = [...newState.currentGame.players].sort(
				(a: BgsPlayer, b: BgsPlayer) => a.leaderboardPlace - b.leaderboardPlace,
			);
			this.currentTurn = newState.currentGame.currentTurn;
			this.lastOpponentCardId = newState.currentGame.lastOpponentCardId;
			this.phase = newState.currentGame.phase;
			this.highlightedTribes = newState.highlightedTribes;
			this.highlightedMinions = newState.highlightedMinions;
			this.updateMinions();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});

		const deckEventBus: BehaviorSubject<any> = this.ow.getMainWindow().deckEventBus;
		const subscriber = new Subscriber<any>(async (event) => {
			const state = event.state as GameState;
			this.tavernBoard = state?.opponentDeck?.board;
			this.updateMinions();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		subscriber['identifier'] = 'bgs-mouse-over';
		this.deckSubscription = deckEventBus.subscribe(subscriber);

		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
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

	private updateMinions() {
		if (this.phase === 'recruit') {
			this.minions = this.tavernBoard;
		} else if (this.phase === 'combat') {
			this.minions = [];
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.deckSubscription?.unsubscribe();
		this.preferencesSubscription?.unsubscribe();
		this.storeSubscription?.unsubscribe();
		console.log('[shutdown] unsubscribed from battlegrounds-mouse-over-overlay');
	}

	trackByFunction(player: BgsPlayer) {
		return player.cardId;
	}

	trackByMinion(minion: DeckCard, index: number) {
		return minion.entityId;
	}

	private setDisplayPreferences(preferences: Preferences) {
		this.showLastOpponentIcon = preferences.bgsShowLastOpponentIconInOverlay;
		this.showTribesHighlight = FeatureFlags.ENABLE_BG_TRIBE_HIGHLIGHT && preferences.bgsShowTribesHighlight;
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
		const height = gameHeight;
		const width = gameHeight * 1.4;
		await this.ow.changeWindowSize(this.windowId, width, height);
		const dpi = gameInfo.logicalWidth / gameWidth;
		const newLeft = dpi * 0.5 * (gameWidth - width);
		await this.ow.changeWindowPosition(this.windowId, newLeft, 0);
	}
}
