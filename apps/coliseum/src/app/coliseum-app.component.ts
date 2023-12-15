import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AllCardsService } from '@firestone-hs/reference-data';
import { ApiRunner, CardsFacadeStandaloneService } from '@firestone/shared/framework/core';
import { loadAsync } from 'jszip';
import { BehaviorSubject, Observable } from 'rxjs';

const RETRIEVE_REVIEW_URL = 'https://itkmxena7k2kkmkgpevc6skcie0tlwmk.lambda-url.us-west-2.on.aws/';
const REPLAY_API = 'https://xml.firestoneapp.com/';

@Component({
	selector: 'coliseum-app',
	templateUrl: './coliseum-app.component.html',
	styleUrls: ['./coliseum-app.component.scss'],
})
export class ColiseumAppComponent implements AfterContentInit, AfterViewInit {
	ready$: Observable<boolean>;

	reviewId: string;
	replayXml: string;

	private ready$$ = new BehaviorSubject<boolean>(false);

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly api: ApiRunner,
		private readonly http: HttpClient,
		private readonly allCards: CardsFacadeStandaloneService,
	) {}

	async ngAfterContentInit() {
		this.ready$ = this.ready$$.asObservable();

		console.debug('loading cards', this.allCards);
		await this.allCards.init(new AllCardsService(), 'enUS');
		await this.allCards.waitForReady();
		this.ready$$.next(true);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async ngAfterViewInit() {
		console.log('replay loader ngAfterViewInit');
		const reviewId = this.getSearchParam('reviewId');
		const bgsSimulation = this.getSearchParam('bgsSimulation');
		const bgsSimulationId = this.getSearchParam('bgsSimulationId');
		console.log('params', reviewId, bgsSimulationId, bgsSimulation);

		if (!reviewId && !bgsSimulationId && !bgsSimulation) {
			console.error('[game-replay] no reviewId or bgsSimulationId or bgsSimulation');
			return;
		}

		if (reviewId) {
			const replayXml = await this.getReplayXml(reviewId);
			if (!replayXml) {
				console.error('[game-replay] could not load replay xml', reviewId);
				return;
			}
			this.replayXml = replayXml;
			this.reviewId = reviewId;
		}

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async getReplayXml(reviewId: string): Promise<string | null> {
		// window['coliseum'].zone.run(() => {
		// 	window['coliseum'].component.updateStatus('Downloading replay file');
		// });
		const review: any = await this.api.callGetApi<any>(`${RETRIEVE_REVIEW_URL}/${reviewId}`);
		if (!review) {
			return null;
		}
		const replay = (await this.loadReplay(review.replayKey)) ?? null;
		console.log('loaded replay');
		return replay;
	}

	private async loadReplay(replayKey: string): Promise<string | undefined> {
		if (replayKey?.endsWith('.zip')) {
			const headers = new HttpHeaders({ 'Content-Type': 'application/zip' }).set('Accept', 'application/zip');
			const zippedReplay = await this.http
				.get(REPLAY_API + replayKey, { headers: headers, responseType: 'blob' })
				.toPromise();
			const zipContent = await loadAsync(zippedReplay as any);
			const file = Object.keys(zipContent.files)[0];

			const replay = await zipContent.file(file)?.async('string');
			return replay;
		} else {
			const headers = new HttpHeaders({ 'Content-Type': 'text/xml' }).set('Accept', 'text/xml');
			const replay = await this.http
				.get(REPLAY_API + replayKey, { headers: headers, responseType: 'text' })
				.toPromise();
			return replay;
		}
	}

	private getSearchParam(name: string): string {
		const searchString = window.location.search.substring(1);
		const searchParams = searchString?.split('&') || [];
		return searchParams
			.filter((param) => param.indexOf('=') !== -1)
			.filter((param) => param.split('=')[0] === name)
			.map((param) => param.split('=')[1])[0];
	}
}
