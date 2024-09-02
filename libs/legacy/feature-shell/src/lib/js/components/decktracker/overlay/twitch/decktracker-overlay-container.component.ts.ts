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
import { GameType, SceneMode } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { Preferences } from '@firestone/shared/common/service';
import { CardsFacadeStandaloneService } from '@firestone/shared/framework/core';
import {
	AbstractSubscriptionTwitchResizableComponent,
	TwitchBgsCurrentBattle,
	TwitchBgsState,
	TwitchEvent,
	TwitchPreferencesService,
	TwitchStreamerConfig,
} from '@firestone/twitch/common';
import { TranslateService } from '@ngx-translate/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { inflate } from 'pako';
import { BehaviorSubject, Observable, from } from 'rxjs';
// import fullState from './game-states/bgs-trinkets.json';
import fullState from './game-states/constructed.json';
import { TwitchCardsFacadeManagerService } from './twitch-cards-facade-manager.service';
import { TwitchLocalizationManagerService } from './twitch-localization-manager.service';

@Component({
	selector: 'decktracker-overlay-container',
	styleUrls: [
		`../../../../../css/themes/decktracker-theme.scss`,
		`../../../../../css/themes/battlegrounds-theme.scss`,
		'./decktracker-overlay-container.component.scss',
	],
	template: `
		<div
			class="container drag-boundary overlay-container-parent"
			*ngIf="baseInitDone$ | async"
			[ngClass]="{
				'battlegrounds-theme': currentDisplayMode === 'battlegrounds',
				'decktracker-theme': currentDisplayMode === 'decktracker'
			}"
		>
			<ng-container *ngIf="inGameplay">
				<state-mouse-over
					*ngIf="gameState || bgsState"
					[gameState]="gameState"
					[bgsState]="bgsState"
					[overlayLeftOffset]="horizontalOffset"
					[magnifierIconOnTop]="magnifierIconOnTop"
				></state-mouse-over>
				<decktracker-overlay-standalone
					class="player"
					[ngClass]="{ reversed: invertTrackedPosition }"
					*ngIf="showDecktracker"
					[gameState]="gameState"
					[side]="'player'"
				>
				</decktracker-overlay-standalone>
				<decktracker-overlay-standalone
					class="opponent"
					[ngClass]="{ reversed: invertTrackedPosition }"
					*ngIf="showDecktracker && (showOpponentTracker$ | async)"
					[gameState]="gameState"
					[side]="'opponent'"
				>
				</decktracker-overlay-standalone>
				<bgs-simulation-overlay-standalone
					*ngIf="bgsState?.inGame && (showBattleSimulator$ | async)"
					[bgsState]="bgsBattleState"
					[streamerPrefs]="streamerPrefs"
					[phase]="bgsState?.phase"
					[hideWhenEmpty]="hideSimulatorWhenEmpty$ | async"
				>
				</bgs-simulation-overlay-standalone>
				<battlegrounds-minions-tiers-twitch
					*ngIf="bgsState?.inGame && (showMinionsList$ | async)"
					[availableRaces]="bgsState.availableRaces"
					[currentTurn]="bgsState.currentTurn"
					[currentTavernTier]="getCurrentTavernTier(bgsState)"
					[hasBuddies]="bgsState.config?.hasBuddies"
					[hasSpells]="bgsState.config?.hasSpells"
					[hasTrinkets]="bgsState.config?.hasTrinkets"
					[anomalies]="bgsState.config?.anomalies"
					[playerCardId]="getMainPlayerCardId(bgsState)"
					[playerTrinkets]="getMainPlayerTrinkets(bgsState)"
					[showMechanicsTiers]="showMechanicsTiers$ | async"
					[showTribeTiers]="showTribeTiers$ | async"
					[showTierSeven]="showTierSeven$ | async"
					[showTrinkets]="showTrinkets$ | async"
					[groupMinionsIntoTheirTribeGroup]="groupMinionsIntoTheirTribeGroup$ | async"
					[includeTrinketsInTribeGroups]="true"
					[gameMode]="gameMode$ | async"
					[gameState]="gameState"
				></battlegrounds-minions-tiers-twitch>
			</ng-container>
			<twitch-config-widget></twitch-config-widget>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerOverlayContainerComponent
	extends AbstractSubscriptionTwitchResizableComponent
	implements AfterViewInit, AfterContentInit
{
	baseInitDone$: Observable<boolean>;
	showMinionsList$: Observable<boolean>;
	showBattleSimulator$: Observable<boolean>;
	hideSimulatorWhenEmpty$: Observable<boolean>;
	showMechanicsTiers$: Observable<boolean>;
	showTribeTiers$: Observable<boolean>;
	showTierSeven$: Observable<boolean>;
	showTrinkets$: Observable<boolean>;
	showOpponentTracker$: Observable<boolean>;
	groupMinionsIntoTheirTribeGroup$: Observable<boolean>;
	gameMode$: Observable<GameType>;

	inGameplay: boolean;
	gameState: GameState;
	bgsState: TwitchBgsState;
	streamerPrefs: Partial<Preferences>;
	bgsBattleState: TwitchBgsCurrentBattle;
	activeTooltip: string;
	showDecktracker: boolean;
	currentDisplayMode: 'decktracker' | 'battlegrounds' = 'battlegrounds';

	// Streamer settings
	horizontalOffset: number;
	magnifierIconOnTop: null | '' | 'top' | 'bottom';
	invertTrackedPosition: boolean | undefined | null;

	private twitch;
	private token: string;
	// private localeInit: boolean;

	private baseInitDone$$ = new BehaviorSubject<boolean>(false);
	private gameMode$$ = new BehaviorSubject<GameType>(null);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		protected readonly prefs: TwitchPreferencesService,
		protected readonly el: ElementRef,
		protected readonly renderer: Renderer2,
		private readonly i18n: LocalizationFacadeService,
		private readonly translate: TranslateService,
		private readonly allCards: CardsFacadeStandaloneService,
		private readonly allCardsManager: TwitchCardsFacadeManagerService,
		private readonly localizationManager: TwitchLocalizationManagerService,
	) {
		super(cdr, prefs, el, renderer);
	}

	ngAfterContentInit(): void {
		this.baseInitDone$ = this.baseInitDone$$.asObservable();
		this.gameMode$ = this.gameMode$$.asObservable();
		this.showMinionsList$ = from(this.prefs.prefs.asObservable()).pipe(
			this.mapData((prefs) => prefs?.showMinionsList),
		);
		this.showBattleSimulator$ = from(this.prefs.prefs.asObservable()).pipe(
			this.mapData((prefs) => prefs?.showBattleSimulator),
		);
		this.hideSimulatorWhenEmpty$ = from(this.prefs.prefs.asObservable()).pipe(
			this.mapData((prefs) => prefs?.hideBattleOddsWhenEmpty),
		);
		this.showMechanicsTiers$ = from(this.prefs.prefs.asObservable()).pipe(
			this.mapData((prefs) => prefs?.bgsShowMechanicsTiers),
		);
		this.showTribeTiers$ = from(this.prefs.prefs.asObservable()).pipe(
			this.mapData((prefs) => prefs?.bgsShowTribeTiers),
		);
		this.showTierSeven$ = from(this.prefs.prefs.asObservable()).pipe(
			this.mapData((prefs) => prefs?.bgsShowTierSeven),
		);
		this.showTrinkets$ = from(this.prefs.prefs.asObservable()).pipe(
			this.mapData((prefs) => prefs?.bgsShowTrinkets),
		);
		this.showOpponentTracker$ = from(this.prefs.prefs.asObservable()).pipe(
			this.mapData((prefs) => prefs?.decktrackerShowOpponentTracker),
		);
		this.groupMinionsIntoTheirTribeGroup$ = from(this.prefs.prefs.asObservable()).pipe(
			this.mapData((prefs) => prefs?.bgsGroupMinionsIntoTheirTribeGroup),
		);
	}

	async ngAfterViewInit() {
		// console.debug('after view init in container');
		super.listenForResize();
		if (!(window as any).Twitch) {
			console.debug('wait for Twitch script');
			setTimeout(() => this.ngAfterViewInit(), 500);
			return;
		}

		await this.localizationManager.init();
		await this.allCardsManager.isReady();
		this.baseInitDone$$.next(true);

		this.twitch = (window as any).Twitch.ext;
		this.twitch.onAuthorized(async (auth) => {
			console.log('on authorized', auth);
			this.token = auth.token;
			console.log('set token', this.token);
			this.twitch.listen('broadcast', async (target, contentType, event) => {
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
				const config: TwitchStreamerConfig = JSON.parse(this.twitch.configuration.broadcaster.content);
				console.log('config', config);
				this.horizontalOffset = config?.horizontalOffset;
				this.magnifierIconOnTop = config?.magnifierIconOnTop;
				this.invertTrackedPosition = config?.invertTrackedPosition;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}
		});
		await this.addDebugGameState();
		console.log('init done', process.env.NODE_ENV);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	getCurrentTavernTier(bgsState: TwitchBgsState): number {
		const history = bgsState.leaderboard?.find((p) => p.isMainPlayer)?.tavernUpgradeHistory;
		return history?.length ? history[history.length - 1].tavernTier : 1;
	}

	getMainPlayerCardId(bgsState: TwitchBgsState): string {
		return bgsState.leaderboard?.find((p) => p.isMainPlayer)?.cardId;
	}

	getMainPlayerTrinkets(bgsState: TwitchBgsState): readonly string[] {
		return [
			bgsState.leaderboard?.find((p) => p.isMainPlayer)?.lesserTrinket,
			bgsState.leaderboard?.find((p) => p.isMainPlayer)?.greaterTrinket,
		].filter((t) => !!t);
	}

	getAllPlayerCardIds(bgsState: TwitchBgsState): readonly string[] {
		return bgsState.leaderboard?.map((p) => p.cardId);
	}

	// protected doResize(newScale: number): void {
	// 	const newSidth = newScale * 250;
	// 	this.el.nativeElement.style.setProperty('--card-tooltip-min-width', `${newSidth}px`);
	// }

	private async processEvent(event: TwitchEvent) {
		console.log('received event', event);
		this.inGameplay = event.scene === SceneMode.GAMEPLAY;
		this.bgsState = event?.bgs;
		// Don't overwrite the battle state if not present in the input state
		this.bgsBattleState = this.bgsState?.currentBattle ?? this.bgsBattleState;
		this.streamerPrefs = event.streamerPrefs;
		// console.log('bgsBattleState', this.bgsBattleState, this.bgsState);
		this.gameState = this.enrichGameState(event?.deck);
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
		this.gameMode$$.next(this.gameState?.metadata?.gameType);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private enrichGameState(gameState: GameState): GameState {
		return GameState.create({
			...gameState,
			playerDeck: this.enrichDeck(gameState.playerDeck),
			opponentDeck: this.enrichDeck(gameState.opponentDeck),
		});
	}

	private enrichDeck(playerDeck: DeckState): DeckState {
		return DeckState.create(playerDeck).update({
			board: this.enrichCards(playerDeck.board),
			deck: this.enrichCards(playerDeck.deck),
			deckList: this.enrichCards(playerDeck.deckList),
			hand: this.enrichCards(playerDeck.hand),
			otherZone: this.enrichCards(playerDeck.otherZone),
			heroPower: this.enrichCard(playerDeck.heroPower),
			weapon: this.enrichCard(playerDeck.weapon),
		});
	}

	private enrichCards(source: readonly DeckCard[]): readonly DeckCard[] {
		return (source ?? []).map((c) => this.enrichCard(c));
	}

	private enrichCard(card: DeckCard): DeckCard {
		if (!card) {
			return null;
		}
		const refCard = !!card.cardId ? this.allCards.getCard(card.cardId) : null;
		if (!refCard) {
			return card;
		}
		return DeckCard.create({
			...card,
			cardName: card.cardName ?? refCard.name,
			manaCost: refCard.hideStats ? null : card.manaCost ?? refCard.cost,
			rarity: card.rarity ?? refCard.rarity,
			cardType: card.cardType ?? refCard.type,
		});
	}

	private async addDebugGameState() {
		if (process.env.NODE_ENV === 'production') {
			return;
		}

		this.gameState = this.enrichGameState((fullState as any).deck);
		this.bgsState = (fullState as any).bgs;
		this.showDecktracker =
			!!this.gameState &&
			!this.bgsState?.inGame &&
			!this.gameState.gameEnded &&
			(!!this.gameState.playerDeck?.deckList?.length || !!this.gameState.playerDeck?.deck?.length);
		this.currentDisplayMode = this.showDecktracker ? 'decktracker' : 'battlegrounds';
		this.inGameplay = true;
		console.log('loaded fake state', this.currentDisplayMode, this.showDecktracker, this.gameState, this.bgsState);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
