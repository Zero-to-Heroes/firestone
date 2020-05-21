import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy } from '@angular/compiler/src/core';
import { Component, Input, OnInit } from '@angular/core';
import { MatchDetail } from '../../models/mainwindow/replays/match-detail';

declare let amplitude;

const REPLAY_API = 'http://xml.firestoneapp.com/';

@Component({
	selector: 'game-replay',
	styleUrls: [`../../../css/component/replays/game-replay.component.scss`],
	template: `
		<div>
			<div id="externalPlayer" class="external-player"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameReplayComponent implements OnInit {
	private initDone = false;

	constructor(private http: HttpClient) {}

	@Input() set replay(value: MatchDetail) {
		this.setReplay(value);
	}

	private async setReplay(value: MatchDetail) {
		await this.resetGame();
		if (value && value.replayInfo) {
			console.log('[game-replay] setting game', value.replayInfo.reviewId);
			this.loadReview(value.replayInfo.reviewId);
		}
	}

	private async loadReview(reviewId: string) {
		const replayXml = await this.getReplayXml(reviewId);
		this.reload(replayXml, reviewId);
	}

	async ngOnInit() {
		// console.log('initializing coliseum');
		try {
			const coliseum = (window as any).coliseum;
			await coliseum.init();
			coliseum.zone.run(() => coliseum.component.reset());
			console.log('coliseum init done');
			this.initDone = true;
		} catch (e) {
			console.error('[game-replay] error wile initializing coliseum', e.message, e);
		}
	}

	async reload(replay: string, reviewId: string) {
		try {
			amplitude.getInstance().logEvent('load-replay');
			console.log('requested replay load');
			await this.waitForViewerInit();
			console.log('loading replay');
			const coliseum = (window as any).coliseum;
			coliseum.zone.run(() => {
				coliseum.component.loadReplay(replay, {
					reviewId: reviewId,
				});
			});
		} catch (e) {
			console.error('[game-replay] error wile reloading replay', reviewId, e.message, e);
		}
	}

	async resetGame() {
		try {
			// Resetting the game
			await this.waitForViewerInit();
			console.log('[game-replay] resetting player');
			const coliseum = (window as any).coliseum;
			coliseum.zone.run(() => coliseum.component.reset());
		} catch (e) {
			console.error('[game-replay] error wile resetting game', e.message, e);
		}
	}

	private async getReplayXml(reviewId: string): Promise<string> {
		window['coliseum'].zone.run(() => {
			window['coliseum'].component.updateStatus('Downloading replay file');
		});
		const review: any = await this.http
			.get(`https://nj8w9uc6p5.execute-api.us-west-2.amazonaws.com/Prod/${reviewId}`)
			.toPromise();
		//console.log('review in firestone', review);
		const headers = new HttpHeaders({ 'Content-Type': 'text/xml' }).set('Accept', 'text/xml');
		console.log('loaded review', reviewId);
		const replay = await this.http
			.get(REPLAY_API + review.replayKey, { headers: headers, responseType: 'text' })
			.toPromise();
		console.log('loaded replay');
		return replay;
	}

	private waitForViewerInit(): Promise<void> {
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
