import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { TwitchPreferencesService } from '@components/decktracker/overlay/twitch/twitch-preferences.service';
import { TranslateService } from '@ngx-translate/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { inflate } from 'pako';
import { from, Observable } from 'rxjs';
import { GameState } from '../../../../models/decktracker/game-state';
import { TwitchEvent } from '../../../../services/mainwindow/twitch-auth.service';
import { AbstractSubscriptionTwitchResizableComponent } from './abstract-subscription-twitch-resizable.component';
import fakeState from './gameState.json';
import { TwitchBgsCurrentBattle, TwitchBgsState } from './twitch-bgs-state';

@Component({
	selector: 'decktracker-overlay-container',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		`../../../../../css/themes/decktracker-theme.scss`,
		`../../../../../css/themes/battlegrounds-theme.scss`,
		'../../../../../css/component/decktracker/overlay/twitch/decktracker-overlay-container.component.scss',
	],
	template: `
		<div
			class="container drag-boundary overlay-container-parent"
			[ngClass]="{
				'battlegrounds-theme': currentDisplayMode === 'battlegrounds',
				'decktracker-theme': currentDisplayMode === 'decktracker'
			}"
		>
			<state-mouse-over
				*ngIf="gameState || bgsState"
				[gameState]="gameState"
				[bgsState]="bgsState"
				[overlayLeftOffset]="horizontalOffset"
				[magnifierIconOnTop]="magnifierIconOnTop"
			></state-mouse-over>
			<decktracker-overlay-standalone *ngIf="showDecktracker" [gameState]="gameState">
			</decktracker-overlay-standalone>
			<bgs-simulation-overlay-standalone
				*ngIf="bgsState?.inGame && !bgsState?.gameEnded && (showBattleSimulator$ | async)"
				[bgsState]="bgsBattleState"
				[phase]="bgsState?.phase"
				[hideWhenEmpty]="hideSimulatorWhenEmpty$ | async"
			>
			</bgs-simulation-overlay-standalone>
			<battlegrounds-minions-tiers-twitch
				*ngIf="bgsState?.inGame && !bgsState?.gameEnded && (showMinionsList$ | async)"
				[availableRaces]="bgsState?.availableRaces"
				[currentTurn]="bgsState?.currentTurn"
			></battlegrounds-minions-tiers-twitch>
			<twitch-config-widget></twitch-config-widget>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerOverlayContainerComponent
	extends AbstractSubscriptionTwitchResizableComponent
	implements AfterViewInit, AfterContentInit {
	showMinionsList$: Observable<boolean>;
	showBattleSimulator$: Observable<boolean>;
	hideSimulatorWhenEmpty$: Observable<boolean>;

	gameState: GameState;
	bgsState: TwitchBgsState;
	bgsBattleState: TwitchBgsCurrentBattle;
	activeTooltip: string;
	showDecktracker: boolean;
	currentDisplayMode: 'decktracker' | 'battlegrounds' = 'battlegrounds';

	// Streamer settings
	horizontalOffset: number;
	magnifierIconOnTop: null | '' | 'top' | 'bottom';

	private twitch;
	private token: string;
	private localeInit: boolean;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		protected readonly prefs: TwitchPreferencesService,
		protected readonly el: ElementRef,
		protected readonly renderer: Renderer2,
		private readonly i18n: LocalizationFacadeService,
		private readonly translate: TranslateService,
	) {
		super(cdr, prefs, el, renderer);
	}

	ngAfterContentInit(): void {
		this.showMinionsList$ = from(this.prefs.prefs.asObservable()).pipe(
			this.mapData((prefs) => prefs?.showMinionsList),
		);
		this.showBattleSimulator$ = from(this.prefs.prefs.asObservable()).pipe(
			this.mapData((prefs) => prefs?.showBattleSimulator),
		);
		this.hideSimulatorWhenEmpty$ = from(this.prefs.prefs.asObservable()).pipe(
			this.mapData((prefs) => prefs?.hideBattleOddsWhenEmpty),
		);
	}

	async ngAfterViewInit() {
		super.listenForResize();
		if (!(window as any).Twitch) {
			setTimeout(() => this.ngAfterViewInit(), 500);
			return;
		}

		this.translate.setDefaultLang('enUS');
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
			await this.translate.use(language).toPromise();
			this.localeInit = true;
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
				this.magnifierIconOnTop = config?.magnifierIconOnTop;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}
		});
		await this.addDebugGameState();
		console.log('init done');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	protected doResize(newScale: number): void {
		const newSidth = newScale * 250;
		this.el.nativeElement.style.setProperty('--card-tooltip-min-width', `${newSidth}px`);
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
		this.currentDisplayMode = !!this.bgsState?.inGame
			? 'battlegrounds'
			: this.showDecktracker
			? 'decktracker'
			: this.currentDisplayMode;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async addDebugGameState() {
		if (process.env.NODE_ENV === 'production') {
			return;
		}

		await this.i18n.setLocale('enUS');
		console.log('finished setting up locale', 'enUS', this.i18n);
		// TODO: use prefs
		await this.translate.use('enUS').toPromise();
		this.gameState = fakeState as any;
		// this.bgsState = fakeBgsState as any;
		this.showDecktracker =
			!!this.gameState &&
			!this.bgsState?.inGame &&
			!this.gameState.gameEnded &&
			(!!this.gameState.playerDeck?.deckList?.length || !!this.gameState.playerDeck?.deck?.length);
		this.currentDisplayMode = this.showDecktracker ? 'decktracker' : 'battlegrounds';
		console.log('loaded fake state', this.currentDisplayMode, this.showDecktracker, this.gameState, this.bgsState);
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
