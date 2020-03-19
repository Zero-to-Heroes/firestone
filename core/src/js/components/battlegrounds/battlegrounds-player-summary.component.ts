import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { AllCardsService, Entity } from '@firestone-hs/replay-parser';
import { NGXLogger } from 'ngx-logger';
import { Subscription } from 'rxjs';
import { BattlegroundsPlayer } from '../../models/battlegrounds/old/battlegrounds-player';
import { BattlegroundsState } from '../../models/battlegrounds/old/battlegrounds-state';
import { DebugService } from '../../services/debug.service';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-player-summary',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/battlegrounds/battlegrounds-player-summary.component.scss',
	],
	template: `
		<div class="battlegrounds-player-summary" *ngIf="activePlayer">
			<battlegrounds-player-info [player]="activePlayer"></battlegrounds-player-info>
			<board [entities]="boardMinions" *ngIf="boardMinions"></board>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	// encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class BattlegroundsPlayerSummaryComponent implements AfterViewInit, OnDestroy {
	state: BattlegroundsState;

	activePlayer: BattlegroundsPlayer;
	boardMinions: readonly Entity[];

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
			this.activePlayer =
				this.state.displayedPlayerCardId && this.state.players && this.state.players.length > 0
					? this.state.players.find(player => player.cardId === this.state.displayedPlayerCardId)
					: null;
			this.boardMinions =
				this.activePlayer && this.activePlayer.boardState && this.activePlayer.boardState.minions;
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
	}

	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.stateSubscription.unsubscribe();
	}

	@HostListener('mousedown')
	dragMove() {
		this.ow.dragMove(this.windowId, async result => {
			// Do nothing
		});
	}

	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		// Window takes 30% of the size of the screen width
		const gameWidth = gameInfo.width;
		const width = gameWidth * 1;
		// Height
		const gameHeight = gameInfo.height;
		const height = gameHeight * 0.2;
		// console.log('changing window size', width, height, gameInfo);
		await this.ow.changeWindowSize(this.windowId, width, height);
	}
}
