import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { NGXLogger } from 'ngx-logger';
import { Subscription } from 'rxjs';
import { BattlegroundsPlayer } from '../../models/battlegrounds/battlegrounds-player';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../models/game-event';
import { Preferences } from '../../models/preferences';
import { DebugService } from '../../services/debug.service';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';

@Component({
	selector: 'battlegrounds-leaderboard-overlay',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/battlegrounds/battlegrounds-leaderboard-overlay.component.scss',
	],
	template: `
		<div class="battlegrounds-leaderboard-overlay">
			<ng-container *ngIf="showPlayerIcon">
				<battlegrounds-leaderboard-player
					*ngFor="let player of players; let i = index; trackBy: trackById"
					[player]="player"
					[style.top.%]="getTopOffset(i)"
					[style.left.%]="getLeftOffset(i)"
					class="player"
				></battlegrounds-leaderboard-player>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	// encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class BattlegroundsLeaderboardOverlayComponent implements AfterViewInit, OnDestroy {
	state: BattlegroundsState;
	players: readonly BattlegroundsPlayer[];
	showPlayerIcon: boolean = false;

	windowId: string;

	private gameInfoUpdatedListener: (message: any) => void;
	private stateSubscription: Subscription;
	private preferencesSubscription: Subscription;

	constructor(
		private logger: NGXLogger,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private init_DebugService: DebugService,
		private allCards: AllCardsService,
		private prefs: PreferencesService,
	) {}

	async ngAfterViewInit() {
		console.log('after leaderboard overlay init');
		// We get the changes via event updates, so automated changed detection isn't useful in PUSH mode
		// this.cdr.detach();

		await this.allCards.initializeCardsDb();

		this.windowId = (await this.ow.getCurrentWindow()).id;
		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe(event => {
			if (event && event.name === PreferencesService.DECKTRACKER_OVERLAY_DISPLAY) {
				this.handleDisplayPreferences(event.preferences);
			}
		});
		const eventBus: EventEmitter<any> = this.ow.getMainWindow().battlegroundsEventBus;
		this.stateSubscription = eventBus.subscribe(async event => {
			console.log('received new event', event);
			// Can happen because we now have a BehaviorSubject
			if (event == null) {
				return;
			}
			if (event.name === GameEvent.GAME_START) {
				this.changeWindowSize();
			}
			const theWindow = await this.ow.getCurrentWindow();
			if (!theWindow) {
				return;
			}
			if (event.state && !theWindow.isVisible) {
				console.log('restoring window', theWindow);
				this.restoreWindow();
			} else if (!event.state) {
				console.log('hiding window', theWindow);
				this.state = event.state;
				this.hideWindow();
				return;
			}
			if (event.state.players !== this.players) {
				this.state = event.state;
				console.log('reassigning players', this.state.players, this.players);
				this.players = this.state.players;
				// this.stateSubscription.unsubscribe();
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
		await this.changeWindowSize();
		// await this.changeWindowPosition();
		// if (!(this.cdr as ViewRef).destroyed) {
		// 	this.cdr.detectChanges();
		// }
		console.log('handled after view init');
		// console.warn('debug to remove');
		await this.restoreWindow();
		await this.handleDisplayPreferences();
		// this.players = [];
		// for (let i = 0; i < 8; i++) {
		// 	this.players.push({ cardId: 'hop' } as BattlegroundsPlayer);
		// }
		// if (!(this.cdr as ViewRef).destroyed) {
		// 	this.cdr.detectChanges();
		// }
		// console.log(this.players);
	}

	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.stateSubscription.unsubscribe();
		this.preferencesSubscription.unsubscribe();
	}

	trackById(index, item: BattlegroundsPlayer) {
		return item.cardId;
	}

	getTopOffset(i: number) {
		// prettier-ignore
		switch(i) {
			case 0: return -1;
			case 1: return -1;
			case 2: return -1;
			case 3: return -1;
			default: return 0;
		}
	}

	getLeftOffset(i: number) {
		// prettier-ignore
		switch(i) {
			case 0: return -4;
			case 1: return -5;
			case 2: return -6;
			case 3: return -8;
			case 4: return -9;
			case 5: return -10;
			case 6: return -11;
			case 7: return -12;
			default: return 0;
		}
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		this.showPlayerIcon = preferences.battlegroundsShowLastOpponentBoard;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		// At different resolutions, the sides of the board are cropped, so we can't use the width
		// for our positioning. The height is always the same though
		const width = gameInfo.height * 0.15;
		// Height
		const height = gameInfo.height * 0.8;
		await this.ow.changeWindowSize(this.windowId, width, height);
		// Move it to the right location
		const center = gameInfo.width / 2;
		const left = center - 0.68 * gameInfo.height;
		const top = (gameInfo.height - height) / 2;
		await this.ow.changeWindowPosition(this.windowId, left, top);
	}

	private async restoreWindow() {
		await this.ow.restoreWindow(this.windowId);
	}

	private hideWindow() {
		this.ow.hideWindow(this.windowId);
	}
}
