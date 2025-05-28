import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { ApiRunner } from '@firestone/shared/framework/core';
import { loadAsync } from 'jszip';
import { MatchDetail } from '../../models/mainwindow/replays/match-detail';

const RETRIEVE_REVIEW_URL = 'https://itkmxena7k2kkmkgpevc6skcie0tlwmk.lambda-url.us-west-2.on.aws/';
const REPLAY_API = 'https://xml.firestoneapp.com/';

@Component({
	selector: 'game-replay',
	styleUrls: [`../../../css/component/replays/game-replay.component.scss`],
	template: `
		<div class="coliseum-container">
			<fs-coliseum
				class="external-player"
				[replayXml]="_replayXml"
				[reviewId]="reviewId"
				[decklist]="decklist"
			></fs-coliseum>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameReplayComponent {
	_replayXml: string;
	reviewId: string;
	decklist: string;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly api: ApiRunner,
		private readonly http: HttpClient,
	) {}

	@Input() set replay(value: MatchDetail) {
		this.setReplay(value);
	}

	private async setReplay(value: MatchDetail) {
		if (!value?.replayInfo) {
			return;
		}

		console.log('[game-replay] setting game', value.replayInfo.reviewId);
		this.decklist = value.replayInfo.playerDecklist;
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
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async getReplayXml(reviewId: string): Promise<string> {
		// window['coliseum'].zone.run(() => {
		// 	window['coliseum'].component.updateStatus('Downloading replay file');
		// });
		const review: any = await this.api.callGetApi<any>(`${RETRIEVE_REVIEW_URL}/${reviewId}`);
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
