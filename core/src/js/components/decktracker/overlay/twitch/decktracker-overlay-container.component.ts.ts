import { HttpClient } from '@angular/common/http';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { inflate } from 'pako';
import { GameState } from '../../../../models/decktracker/game-state';
import { TwitchEvent } from '../../../../services/mainwindow/twitch-auth.service';
import fakeBgsState from './bgsState.json';
import fakeState from './gameState.json';
import { LocalizationStandaloneService } from './localization-standalone.service';
import { TwitchBgsCurrentBattle, TwitchBgsState } from './twitch-bgs-state';

const EBS_URL = 'https://ebs.firestoneapp.com/deck';
// const EBS_URL = 'https://localhost:8081/deck';

@Component({
	selector: 'decktracker-overlay-container',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/decktracker/overlay/twitch/decktracker-overlay-container.component.scss',
		`../../../../../css/themes/battlegrounds-theme.scss`,
		// '../../../../../css/component/decktracker/overlay/twitch/decktracker-overlay-container-dev.component.scss',
	],
	template: `
		<div class="container drag-boundary overlay-container-parent battlegrounds-theme">
			<state-mouse-over
				*ngIf="gameState || bgsState"
				[gameState]="gameState"
				[bgsState]="bgsState"
				[overlayLeftOffset]="horizontalOffset"
			></state-mouse-over>
			<decktracker-overlay-standalone
				*ngIf="showDecktracker"
				[gameState]="gameState"
				(dragStart)="onDragStart()"
				(dragEnd)="onDragEnd()"
			>
			</decktracker-overlay-standalone>
			<bgs-simulation-overlay-standalone
				*ngIf="bgsState?.inGame && !bgsState?.gameEnded"
				[bgsState]="bgsBattleState"
				(dragStart)="onDragStart()"
				(dragEnd)="onDragEnd()"
			>
			</bgs-simulation-overlay-standalone>
			<twitch-config-widget> </twitch-config-widget>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerOverlayContainerComponent implements AfterViewInit {
	gameState: GameState;
	bgsState: TwitchBgsState;
	bgsBattleState: TwitchBgsCurrentBattle;
	activeTooltip: string;
	showDecktracker: boolean;
	horizontalOffset: number;

	private twitch;
	private token: string;
	private localeInit: boolean;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly http: HttpClient,
		private readonly i18n: LocalizationStandaloneService,
		private readonly translate: TranslateService,
	) {}

	async ngAfterViewInit() {
		if (!(window as any).Twitch) {
			setTimeout(() => this.ngAfterViewInit(), 500);
			return;
		}
		this.translate.setDefaultLang('enUS');
		// TODO: use prefs
		await this.translate.use('enUS').toPromise();
		this.twitch = (window as any).Twitch.ext;
		this.twitch.onAuthorized(async (auth) => {
			this.localeInit = false;
			console.log('on authorized', auth);
			this.token = auth.token;
			console.log('set token', this.token);
			console.log('search params', window.location.search);
			const queryLanguage = new URLSearchParams(window.location.search).get('language');
			const language = mapTwitchLanguageToHsLocale(queryLanguage);
			console.log('mapped to HS locale', language);
			await this.i18n.setLocale(language);
			console.log('finished setting up locale', language, this.i18n);
			this.localeInit = true;
			// this.fetchInitialState();
			this.twitch.listen('broadcast', async (target, contentType, event) => {
				await this.waitForLocaleInit();
				const deckEvent: TwitchEvent = JSON.parse(inflate(event, { to: 'string' }));
				this.processEvent(deckEvent);
			});
		});
		// this.twitch.onContext(async (context, props) => {
		// 	console.log('on context', context, props);
		// 	if (!props?.length || props.includes('language')) {
		// 		this.localeInit = false;
		// 		console.log('changing extension language', context?.language);
		// 		const language = mapTwitchLanguageToHsLocale(context?.language);
		// 		console.log('mapped to HS locale', language);
		// 		await this.i18n.setLocale(language);
		// 		console.log('finished setting up locale', language);
		// 		this.localeInit = true;
		// 	}
		// });
		this.twitch.configuration.onChanged(() => {
			console.log();
			console.log(
				'received configuration',
				this.twitch.configuration.broadcaster,
				window,
				window.location,
				window.location.search,
			);
			if (this.twitch.configuration.broadcaster) {
				const config = JSON.parse(this.twitch.configuration.broadcaster.content);
				console.log('config', config);
				this.horizontalOffset = config?.horizontalOffset;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}
		});
		console.log('init done');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onDragStart() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onDragEnd() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private fetchInitialState() {
		console.log('retrieving initial state');
		const options = {
			headers: { 'Authorization': 'Bearer ' + this.token },
		};
		this.http.get(EBS_URL, options).subscribe(
			(result: any) => {
				console.log('successfully retrieved initial state', result);
				this.processEvent(result);
			},
			(error) => {
				console.log('could not retrieve initial state, waiting for EBS update');
			},
		);
	}

	private async processEvent(event: TwitchEvent) {
		console.log('received event', event);
		this.bgsState = event?.bgs;
		// Don't overwrite the battle state if not present in the input state
		this.bgsBattleState = this.bgsState?.currentBattle ?? this.bgsBattleState;
		// console.log('bgsBattleState', this.bgsBattleState, this.bgsState);
		this.gameState = event?.deck;
		this.showDecktracker =
			!!this.gameState &&
			!this.bgsState?.inGame &&
			!this.gameState.gameEnded &&
			(!!this.gameState.playerDeck?.deckList?.length || !!this.gameState.playerDeck?.deck?.length);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private addDebugGameState() {
		this.gameState = fakeState as any;
		this.bgsState = fakeBgsState as any;
		console.log('loaded fake state', this.gameState, this.bgsState);
	}

	private waitForLocaleInit(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (this.localeInit) {
					resolve();
				} else {
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}

const mapTwitchLanguageToHsLocale = (twitchLanguage: string): string => {
	const mapping = {
		// 'de': 'deDE',
		'en': 'enUS',
		'en-gb': 'enUS',
		// 'es': 'esES',
		// 'es-mx': 'esMX',
		'fr': 'frFR',
		// 'it': 'itIT',
		// 'ja': 'jaJP',
		// 'ko': 'koKR',
		// 'pl': 'plPL',
		// 'pt': 'ptBR',
		// 'pt-br': 'ptBR',
		// 'ru': 'ruRU',
		// 'th': 'thTH',
		// 'zh-cn': 'zhCN',
		// 'zh-tw': 'zhTW',
	};
	const hsLocale = mapping[twitchLanguage] ?? 'enUS';
	return hsLocale;
};
