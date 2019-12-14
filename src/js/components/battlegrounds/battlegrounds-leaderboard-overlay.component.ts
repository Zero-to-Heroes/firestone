import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Subscription } from 'rxjs';
import { BattlegroundsPlayer } from '../../models/battlegrounds/battlegrounds-player';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
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
		<div class="battlegrounds-leaderboard-overlay">
			<battlegrounds-leaderboard-player
				*ngFor="let player of players; let i = index; trackBy: trackById"
				[player]="player"
				[style.top.%]="getTopOffset(i)"
				[style.left.%]="getLeftOffset(i)"
				class="player"
			></battlegrounds-leaderboard-player>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsLeaderboardOverlayComponent implements AfterViewInit, OnDestroy {
	state: BattlegroundsState;
	players: readonly BattlegroundsPlayer[];

	windowId: string;

	private gameInfoUpdatedListener: (message: any) => void;
	private stateSubscription: Subscription;

	constructor(
		private logger: NGXLogger,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private init_DebugService: DebugService,
	) {}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		const eventBus: EventEmitter<any> = this.ow.getMainWindow().battlegroundsEventBus;
		this.stateSubscription = eventBus.subscribe(async event => {
			// console.log('received new event', event);
			// Can happen because we now have a BehaviorSubject
			if (event == null) {
				return;
			}
			this.state = event.state;
			this.players = this.state ? this.state.players : null;
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
}
