import { HttpClient } from '@angular/common/http';
import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

const REPLAY_XML_ENDPOINT = 'https://s3-us-west-2.amazonaws.com/com.zerotoheroes.output/';

@Component({
	selector: 'game-replay',
	styleUrls: [`../../../../css/component/match-stats/game-replay/game-replay.component.scss`],
	template: `
		<div class="game-replay">
			<div id="externalPlayer" class="external-player"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameReplayComponent implements OnInit, AfterViewInit {
	_replayKey: string;
	_reviewId: string;

	@Input() set replayKey(value: string) {
		this._replayKey = value;
		this.logger.debug('[game-replay] set replayKey', value, this);
		this.loadReplay();
	}

	@Input() set reviewId(value: string) {
		this._reviewId = value;
		this.logger.debug('[game-replay] set reviewId', value, this);
		this.loadReplay();
	}

	private initDone = false;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly logger: NGXLogger,
		private readonly ow: OverwolfService,
		private readonly http: HttpClient,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	async ngOnInit() {
		this.logger.debug('[game-replay] initializing coliseum');
		const coliseum = (window as any).coliseum;
		await coliseum.init();
		coliseum.zone.run(() => coliseum.component.reset());
		this.logger.debug('[game-replay] coliseum init done');
		this.initDone = true;
	}

	private async loadReplay() {
		if (!this._reviewId || !this._replayKey) {
			this.resetGame();
			return;
		}
		this.logger.debug('[game-replay] loading replay', this._replayKey, this._replayKey);
		const replayXml = await this.loadReplayXml();
		await this.reload(replayXml, this._reviewId);
	}

	async reload(replay: string, reviewId: string) {
		this.logger.debug('[game-replay] requested replay load');
		await this.waitForViewerInit();
		this.logger.debug('[game-replay] loading replay');
		const coliseum = (window as any).coliseum;
		coliseum.zone.run(() => {
			coliseum.component.loadReplay(replay, {
				reviewId: reviewId,
			});
		});
	}

	async resetGame() {
		// Resetting the game
		await this.waitForViewerInit();
		this.logger.debug('[game-replay] resetting player');
		const coliseum = (window as any).coliseum;
		coliseum.zone.run(() => coliseum.component.reset());
	}

	// closeReplay() {
	// 	this.stateUpdater.next(new HideDeckReplayEvent());
	// }

	private async loadReplayXml(): Promise<string> {
		// TODO: https://www.npmjs.com/package/async-await-retry
		return new Promise<string>(resolve => {
			this.http.get(REPLAY_XML_ENDPOINT + this._replayKey, { responseType: 'text' }).subscribe((res: string) => {
				this.logger.debug('[game-replayr] retrieved XML replay');
				resolve(res);
			});
		});
	}

	private async waitForViewerInit(): Promise<void> {
		return new Promise<void>(resolve => {
			const viewerWait = () => {
				if (this.initDone) {
					resolve();
				} else {
					setTimeout(() => viewerWait(), 50);
				}
			};
			viewerWait();
		});
	}
}
