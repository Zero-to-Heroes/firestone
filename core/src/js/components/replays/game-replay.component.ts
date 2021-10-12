import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy } from '@angular/compiler/src/core';
import { Component, Input, OnInit } from '@angular/core';
import { loadAsync } from 'jszip';
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
		await this.resetGame(value.replayInfo.reviewId);
		if (value && value.replayInfo) {
			console.log('[game-replay] setting game', value.replayInfo.reviewId);
			this.loadReview(value.replayInfo.reviewId);
		}
	}

	private async loadReview(reviewId: string) {
		const replayXml = await this.getReplayXml(reviewId);
		if (!replayXml) {
			console.error('[game-replay] could not load replay xml', reviewId);
			return;
		}
		this.reload(replayXml, reviewId);
	}

	async ngOnInit() {
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
			await this.waitForViewerInit();
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

	async resetGame(reviewId: string) {
		try {
			// Resetting the game
			await this.waitForViewerInit();
			const coliseum = (window as any).coliseum;
			coliseum.zone.run(() => coliseum.component.reset(reviewId));
		} catch (e) {
			console.error('[game-replay] error wile resetting game', e.message, e);
		}
	}

	private async getReplayXml(reviewId: string): Promise<string> {
		window['coliseum'].zone.run(() => {
			window['coliseum'].component.updateStatus('Downloading replay file');
		});
		const review: any = await this.http
			.get(`https://static-api.firestoneapp.com/retrieveReview/${reviewId}`)
			.toPromise();
		if (!review) {
			return null;
		}
		const replay = await this.loadReplay(review.replayKey);
		console.log('loaded replay');
		return replay;
	}

	private async loadReplay(replayKey: string): Promise<string> {
		if (replayKey?.endsWith('.zip')) {
			const headers = new HttpHeaders({ 'Content-Type': 'application/zip' }).set('Accept', 'application/zip');
			const zippedReplay = await this.http
				.get(REPLAY_API + replayKey, { headers: headers, responseType: 'blob' })
				.toPromise();
			const zipContent = await loadAsync(zippedReplay as any);
			const file = Object.keys(zipContent.files)[0];

			const replay = await zipContent.file(file).async('string');
			return replay;
		} else {
			const headers = new HttpHeaders({ 'Content-Type': 'text/xml' }).set('Accept', 'text/xml');
			const replay = await this.http
				.get(REPLAY_API + replayKey, { headers: headers, responseType: 'text' })
				.toPromise();
			return replay;
		}
	}

	private waitForViewerInit(): Promise<void> {
		return new Promise<void>((resolve) => {
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
