/* eslint-disable @typescript-eslint/no-empty-function */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Inject,
	Input,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { CardClass, CardIds, GameType, ReferenceCard, SceneMode } from '@firestone-hs/reference-data';
import { ArenaCardOption, ArenaCardStatsService, ArenaClassStatsService } from '@firestone/arena/common';
import { BattlegroundsQuestsService } from '@firestone/battlegrounds/common';
import { CardOption, DeckCard, GameState, GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, uuidShort } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	CardsFacadeService,
	IAdsService,
	OverwolfService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, filter, from, shareReplay, switchMap } from 'rxjs';
import { CardsHighlightFacadeService } from '../../../services/decktracker/card-highlight/cards-highlight-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';
import { buildBasicCardChoiceValue } from './card-choice-values';

@Component({
	selector: 'choosing-card-widget-wrapper',
	styleUrls: ['./choosing-card-widget-wrapper.component.scss'],
	template: `
		<div class="container" *ngIf="showWidget$ | async">
			<div
				class="choosing-card-container items-{{ value.options?.length }}"
				*ngIf="{ options: options$ | async } as value"
			>
				<choosing-card-option
					class="option-container"
					*ngFor="let option of value.options"
					[option]="option"
					[arenaCard]="isArenaCard$ | async"
					[playerClass]="playerClass$ | async"
				></choosing-card-option>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingCardWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = null;
	protected defaultPositionTopProvider = null;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = null;

	showWidget$: Observable<boolean>;
	isArenaCard$: Observable<boolean>;
	playerClass$: Observable<string | null>;
	options$: Observable<readonly CardChoiceOption[]>;

	windowWidth: number;
	windowHeight: number;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly scene: SceneService,
		private readonly quests: BattlegroundsQuestsService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.quests, this.gameState);

		this.isArenaCard$ = this.gameState.gameState$$.pipe(
			this.mapData((state) => state?.metadata?.gameType === GameType.GT_ARENA),
			shareReplay(1),
		);
		this.playerClass$ = this.gameState.gameState$$.pipe(
			this.mapData((state) =>
				state?.playerDeck?.hero?.classes?.[0]
					? CardClass[state.playerDeck.hero.classes[0]].toLowerCase()
					: null,
			),
			shareReplay(1),
		);
		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.store.listen$(([main, nav, prefs]) => prefs.overlayEnableDiscoverHelp),
			this.store.listenDeckState$(
				(deckState) => deckState?.playerDeck?.currentOptions,
				(deckState) => deckState?.metadata?.gameType,
			),
		]).pipe(
			this.mapData(([currentScene, [displayFromPrefs], [currentOptions, gameType]]) => {
				if (!displayFromPrefs) {
					return false;
				}

				// We explicitely don't check for null, so that if the memory updates are broken
				// we still somehow show the info
				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}

				if (!currentOptions?.length) {
					return false;
				}

				if (
					![
						GameType.GT_CASUAL,
						GameType.GT_PVPDR,
						GameType.GT_PVPDR_PAID,
						GameType.GT_RANKED,
						GameType.GT_ARENA,
						GameType.GT_VS_AI,
						GameType.GT_VS_FRIEND,
					].includes(gameType)
				) {
					return false;
				}

				return true;
			}),
			this.handleReposition(),
		);

		this.options$ = combineLatest([this.store.listenDeckState$((state) => state)]).pipe(
			this.mapData(([[state]]) => {
				const options = state.playerDeck?.currentOptions;
				return options?.map((o) => {
					const result: CardChoiceOption = {
						cardId: o.cardId,
						entityId: o.entityId,
						flag: this.buildFlag(o, state),
						value: buildBasicCardChoiceValue(o, state, this.allCards, this.i18n),
					};
					return result;
				});
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildFlag(option: CardOption, state: GameState): CardOptionFlag {
		switch (option.source) {
			case CardIds.GuessTheWeight:
				return 'value';
			case CardIds.MurlocHolmes_REV_022:
			case CardIds.MurlocHolmes_REV_770:
				switch (option.context?.DataNum1) {
					case 1:
						const isInStartingHand = state.opponentDeck
							.getAllCardsInDeck()
							.filter((c) => c.cardId === option.cardId)
							.filter((c) => !!(c as DeckCard).metaInfo)
							.some(
								(c) =>
									(c as DeckCard).metaInfo.turnAtWhichCardEnteredHand === 'mulligan' ||
									(c as DeckCard).metaInfo.turnAtWhichCardEnteredHand === 0,
							);
						console.debug(
							'[murloc-holmes] mulligan help',
							option,
							isInStartingHand,
							state.opponentDeck
								.getAllCardsInDeck()
								.filter((c) => !!(c as DeckCard).metaInfo)
								.filter(
									(c) =>
										(c as DeckCard).metaInfo.turnAtWhichCardEnteredHand === 'mulligan' ||
										(c as DeckCard).metaInfo.turnAtWhichCardEnteredHand === 0,
								)
								.map((c) => ({
									cardId: c.cardId,
									turnAtWhichCardEnteredHand: (c as DeckCard).metaInfo.turnAtWhichCardEnteredHand,
									metaInfo: (c as DeckCard).metaInfo,
								})),
						);
						return isInStartingHand ? 'flag' : null;
					case 2:
						const isInHand = !!state.opponentDeck.hand.filter((c) => c.cardId === option.cardId).length;
						return isInHand ? 'flag' : null;
					case 3:
						// const isInDeck = !!state.opponentDeck.deck.filter((c) => c.cardId === option.cardId).length;
						// return isInDeck ? 'flag' : null;
						// Don't return a flag here, because we don't know if the card could be in their hand
						return null;
				}
				break;
			case CardIds.DiscoverQuestRewardDntToken:
				return 'value';
		}
		return null;
	}
}

@Component({
	selector: 'choosing-card-option',
	styleUrls: ['./choosing-card-widget-wrapper.component.scss'],
	template: `
		<div class="option" (mouseenter)="onMouseEnter($event)" (mouseleave)="onMouseLeave($event)">
			<ng-container *ngIf="arenaCard$$ | async">
				<ng-container *ngIf="showArenaCardStatDuringDiscovers$ | async">
					<arena-card-option-view
						[card]="arenaCardStats$ | async"
						*ngIf="canSeeWidget$ | async"
					></arena-card-option-view>
					<arena-option-info-premium
						class="premium"
						*ngIf="!(canSeeWidget$ | async)"
					></arena-option-info-premium>
				</ng-container>
			</ng-container>
			<ng-container *ngIf="!(arenaCard$$ | async)">
				<div class="flag-container" *ngIf="showFlag">
					<div class="flag" [inlineSVG]="'assets/svg/new_record.svg'"></div>
				</div>
				<div class="flag-container value-container" *ngIf="showValue">
					<div class="value">
						{{ value }}
					</div>
				</div>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingCardOptionComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	arenaCardStats$: Observable<ArenaCardOption>;
	showArenaCardStatDuringDiscovers$: Observable<boolean | null>;
	canSeeWidget$: Observable<boolean | null>;

	@Input() set option(value: CardChoiceOption) {
		this._option = value;
		this._referenceCard = this.allCards.getCard(value?.cardId);
		this.shouldHighlight = !NO_HIGHLIGHT_CARD_IDS.includes(value?.cardId as CardIds);

		this.showFlag = value?.flag === 'flag';
		this.showValue = value?.flag === 'value';
		this.value = value.value;
		this.cardId$$.next(value?.cardId);
		// this.tooltip = value.tooltip;
		this.registerHighlight();
	}

	@Input() set arenaCard(value: boolean | null) {
		this.arenaCard$$.next(value ?? false);
	}

	@Input() set playerClass(value: string | null) {
		this.playerClass$$.next(value);
	}

	@Input() tallOption: boolean;

	_option: CardChoiceOption;
	showFlag: boolean;
	showValue: boolean;
	value: string;
	// tooltip: string;

	private _referenceCard: ReferenceCard;
	private side: 'player' | 'opponent' = 'player';
	private _uniqueId: string;
	private shouldHighlight: boolean;

	private cardId$$ = new BehaviorSubject<string | null>(null);
	private playerClass$$ = new BehaviorSubject<string | null>(null);
	arenaCard$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly cardsHighlightService: CardsHighlightFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly arenaCardStats: ArenaCardStatsService,
		private readonly arenaClassStats: ArenaClassStatsService,
		private readonly prefs: PreferencesService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.arenaCardStats);

		this.showArenaCardStatDuringDiscovers$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.arenaShowCardStatDuringDiscovers),
		);
		this.canSeeWidget$ = this.ads.hasPremiumSub$$.pipe(this.mapData((hasPremium) => hasPremium));
		this.arenaCardStats$ = combineLatest([this.cardId$$, this.arenaCard$$, this.playerClass$$]).pipe(
			filter(([cardId, arenaCard]) => !!cardId && !!arenaCard),
			switchMap(([cardId, arenaCard, playerClass]) =>
				from(this.arenaCardStats.getStatsFor(cardId, playerClass)).pipe(
					this.mapData((stat) => ({ stat, playerClass })),
				),
			),
			switchMap(async ({ stat, playerClass }) => {
				if (!stat) {
					return null;
				}
				const heroStats = await this.arenaClassStats.classStats$$.getValueWithInit();
				const heroStat = heroStats?.stats.find(
					(s) => s.playerClass?.toUpperCase() === playerClass?.toUpperCase(),
				);
				const currentHeroWinrate = !heroStat?.totalGames
					? null
					: (heroStat?.totalsWins ?? 0) / heroStat.totalGames;
				const drawnWinrate = !stat?.matchStats?.stats?.drawn
					? null
					: stat.matchStats.stats.drawnThenWin / stat.matchStats.stats.drawn;
				const drawnImpact =
					currentHeroWinrate == null || drawnWinrate == null ? null : drawnWinrate - currentHeroWinrate;
				const result: ArenaCardOption = {
					cardId: stat.cardId,
					drawnImpact: drawnImpact,
				} as ArenaCardOption;
				return result;
			}),
			this.mapData((stat) => stat),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	registerHighlight() {
		this._uniqueId && this.cardsHighlightService.unregister(this._uniqueId, this.side);
		this._uniqueId = this._uniqueId || uuidShort();
		if (this.shouldHighlight) {
			this.cardsHighlightService.register(
				this._uniqueId,
				{
					referenceCardProvider: () => this._referenceCard,
					// We don't react to highlights, only trigger them
					deckCardProvider: () => null,
					zoneProvider: () => null,
					highlightCallback: () => {},
					unhighlightCallback: () => {},
					side: () => 'player',
				},
				'player',
			);
		}
	}

	onMouseEnter(event: MouseEvent) {
		if (!this.shouldHighlight) {
			return;
		}
		this.cardsHighlightService?.onMouseEnter(this._option?.cardId, this.side, null);
	}

	onMouseLeave(event: MouseEvent) {
		if (!this.shouldHighlight) {
			return;
		}
		this.cardsHighlightService?.onMouseLeave(this._option?.cardId);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.cardsHighlightService?.onMouseLeave(this._option?.cardId);
		this.cardsHighlightService.unregister(this._uniqueId, this.side);
	}
}

// For discovers for which knowing the effect on your deck isn't relevant
const NO_HIGHLIGHT_CARD_IDS = [CardIds.MurlocHolmes_REV_022, CardIds.MurlocHolmes_REV_770];

export interface CardChoiceOption {
	readonly cardId: string;
	readonly entityId: number;
	readonly flag?: CardOptionFlag;
	readonly value?: string;
}

export type CardOptionFlag = 'flag' | 'value' | null;
