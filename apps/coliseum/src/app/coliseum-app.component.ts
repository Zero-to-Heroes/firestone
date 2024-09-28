import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AllCardsService } from '@firestone-hs/reference-data';
import { GameSample } from '@firestone-hs/simulate-bgs-battle/dist/simulation/spectator/game-sample';
import { ColiseumDebugService, ReplayLocation } from '@firestone/replay/coliseum';
import { ApiRunner, CardsFacadeStandaloneService } from '@firestone/shared/framework/core';
import { loadAsync } from 'jszip';
import { BehaviorSubject, Observable } from 'rxjs';
import { debugBgsSimulation } from './debug-sim';

const RETRIEVE_REVIEW_URL = 'https://itkmxena7k2kkmkgpevc6skcie0tlwmk.lambda-url.us-west-2.on.aws/';
const REPLAY_API = 'https://xml.firestoneapp.com/';
const BGS_SAMPLE_API = 'https://h7h6lfnlmd7vstumpqiz74xqoq0vhsnm.lambda-url.us-west-2.on.aws/';

@Component({
	selector: 'coliseum-app',
	templateUrl: './coliseum-app.component.html',
	styleUrls: ['./coliseum-app.component.scss'],
})
export class ColiseumAppComponent implements AfterContentInit, AfterViewInit {
	ready$: Observable<boolean>;

	reviewId: string | null;
	replayXml: string | null;
	bgsSimulation: GameSample | null;
	initialLocation: ReplayLocation;

	private ready$$ = new BehaviorSubject<boolean>(false);

	private bgsSimulationId: string;
	private bgsSimulationString: string;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly api: ApiRunner,
		private readonly http: HttpClient,
		private readonly allCards: CardsFacadeStandaloneService,
		private readonly debugService: ColiseumDebugService,
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
		const reviewId = this.getSearchParam('reviewId');
		const bgsSimulationInput = this.getSearchParam('bgsSimulation');
		const bgsSimulationId = this.getSearchParam('bgsSimulationId');
		const bgsSimulation = bgsSimulationInput === 'debug' ? debugBgsSimulation : bgsSimulationInput;
		// console.debug('bgsSimulation', bgsSimulation);
		const initialTurn = this.getSearchParam('turn');
		const initialAction = this.getSearchParam('action');
		const debug = this.getSearchParam('debug');

		if (debug) {
			this.debugService.active = true;
		}

		console.debug('params', reviewId, bgsSimulationId, bgsSimulation);
		this.reviewId = reviewId;
		this.bgsSimulationId = bgsSimulationId;
		this.bgsSimulationString = bgsSimulation;
		if (initialTurn || initialAction) {
			this.initialLocation = {
				turn: parseInt(initialTurn),
				action: parseInt(initialAction),
			};
			console.debug('initial location', this.initialLocation);
		}

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
		} else if (bgsSimulationId) {
			console.log('loading', bgsSimulationId);
			const gameSample = await this.retrieveEncodedSimulation(bgsSimulationId);
			console.debug('parsed', gameSample);
			this.bgsSimulation = gameSample;
		} else if (bgsSimulation) {
			// console.log('decoding', bgsSimulation);
			const decoded = atob(bgsSimulation);
			// console.log('decoded', decoded);
			const parsed = JSON.parse(decoded);
			console.debug('parsed', parsed);
			this.bgsSimulation = parsed;
		}

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onReplayLocationUpdated(location: ReplayLocation) {
		const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
		const reviewQuery = this.reviewId
			? `reviewId=${this.reviewId}&`
			: this.bgsSimulationString
			? `bgsSimulation=${this.bgsSimulationString}&`
			: this.bgsSimulationId
			? `bgsSimulationId=${this.bgsSimulationId}&`
			: '';

		const queryString = `${reviewQuery}turn=${location.turn}&action=${location.action}`;
		const newUrl = `${baseUrl}?${queryString}`;
		window.history.replaceState({ path: newUrl }, '', newUrl);
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
			const baseUrl = REPLAY_API + replayKey;
			const url = this.debugService.active ? baseUrl + `?ts=${new Date().getTime()}` : baseUrl;
			console.debug('loading zipped replay', url);
			const zippedReplay = await this.http.get(url, { headers: headers, responseType: 'blob' }).toPromise();
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

	private async retrieveEncodedSimulation(bgsSimulationId: string): Promise<GameSample | null> {
		try {
			const sample: GameSample = (await this.http
				.get(BGS_SAMPLE_API + bgsSimulationId, {
					headers: new HttpHeaders({
						'Content-Type': 'application/json',
					}).set('Accept', 'application/json'),
					withCredentials: false,
				})
				.toPromise()) as GameSample;
			console.debug('retrieved sample', sample);
			return sample;
		} catch (e: any) {
			console.error('issue retrieve bgs sample', bgsSimulationId, e.message, e);
		}
		return null;
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
