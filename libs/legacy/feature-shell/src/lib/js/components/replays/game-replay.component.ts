import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { loadAsync } from 'jszip';
import { MatchDetail } from '../../models/mainwindow/replays/match-detail';

declare let amplitude;

const REPLAY_API = 'https://xml.firestoneapp.com/';

@Component({
	selector: 'game-replay',
	styleUrls: [`../../../css/component/replays/game-replay.component.scss`],
	template: `
		<div>
			<fs-coliseum [replayXml]="_replayXml" [reviewId]="reviewId"></fs-coliseum>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameReplayComponent {
	_replayXml: string;
	reviewId: string;

	constructor(private http: HttpClient) {}

	@Input() set replay(value: MatchDetail) {
		this.setReplay(value);
	}

	private async setReplay(value: MatchDetail) {
		if (!value?.replayInfo) {
			return;
		}

		console.log('[game-replay] setting game', value.replayInfo.reviewId);
		this.loadReview(value.replayInfo.reviewId);
	}

	private async loadReview(reviewId: string) {
		const replayXml = await this.getReplayXml(reviewId);
		if (!replayXml) {
			console.error('[game-replay] could not load replay xml', reviewId);
			return;
		}
		this._replayXml = replayXml;
		this.reviewId = reviewId;
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
}
