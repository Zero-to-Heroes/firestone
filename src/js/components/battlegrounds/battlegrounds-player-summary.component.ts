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
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../models/game-event';
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
		<div class="battlegrounds-player-summary">
			{{ state }}
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	// encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class BattlegroundsPlayerSummaryComponent implements AfterViewInit, OnDestroy {
	state: BattlegroundsState;
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
		// We get the changes via event updates, so automated changed detection isn't useful in PUSH mode
		this.cdr.detach();

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
	}

	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.stateSubscription.unsubscribe();
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
		await this.ow.changeWindowSize(this.windowId, width, height);
	}

	private async restoreWindow() {
		await this.ow.restoreWindow(this.windowId);
	}

	private hideWindow() {
		this.ow.hideWindow(this.windowId);
	}
}
