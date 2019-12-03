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
import { DebugService } from '../../services/debug.service';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-leaderboard-overlay',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/battlegrounds/battlegrounds-leaderboard-overlay.component.scss',
	],
	template: `
		<div class="battlegrounds-leaderboard-overlay" *ngIf="state">
			<li class="player" *ngFor="let player of players; trackBy: trackById"></li>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	// encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class BattlegroundsLeaderboardOverlayComponent implements AfterViewInit, OnDestroy {
	state: BattlegroundsState;
	players: BattlegroundsPlayer[];

	windowId: string;

	private gameInfoUpdatedListener: (message: any) => void;
	private stateSubscription: Subscription;

	constructor(
		private logger: NGXLogger,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private init_DebugService: DebugService,
		private allCards: AllCardsService,
	) {}

	async ngAfterViewInit() {
		// We get the changes via event updates, so automated changed detection isn't useful in PUSH mode
		this.cdr.detach();

		await this.allCards.initializeCardsDb();

		this.windowId = (await this.ow.getCurrentWindow()).id;
		const eventBus: EventEmitter<any> = this.ow.getMainWindow().battlegroundsEventBus;
		this.stateSubscription = eventBus.subscribe(async event => {
			console.log('received new event', event);
			// Can happen because we now have a BehaviorSubject
			if (event == null) {
				return;
			}
			this.state = event.state;
			if (event.name === GameEvent.GAME_START) {
				this.changeWindowSize();
			}
			if (this.state) {
				this.restoreWindow();
			} else {
				this.hideWindow();
			}

			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
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
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		console.log('handled after view init');
		// console.warn('debug to remove');
		// await this.restoreWindow();
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
	}

	trackById(index, item: BattlegroundsPlayer) {
		return item.cardId;
	}

	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		// At different resolutions, the sides of the board are cropped, so we can't use the width
		// for our positioning. The height is always the same though
		const width = gameInfo.height * 0.1;
		// Height
		const height = gameInfo.height * 0.8;
		await this.ow.changeWindowSize(this.windowId, width, height);
		// Move it to the right location
		const center = gameInfo.width / 2;
		const left = center - 0.65 * gameInfo.height;
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
