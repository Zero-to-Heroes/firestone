/* eslint-disable @typescript-eslint/no-empty-function */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BgsQuestStats } from '@firestone-hs/bgs-global-stats';
import { CardIds, ReferenceCard, SceneMode } from '@firestone-hs/reference-data';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { CardOption } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { CardsHighlightFacadeService } from '../../../services/decktracker/card-highlight/cards-highlight-facade.service';
import { FeatureFlags } from '../../../services/feature-flags';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { uuid } from '../../../services/utils';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';
import { buildBasicCardChoiceValue, buildBgsQuestCardChoiceValue } from './card-choice-values';

@Component({
	selector: 'choosing-card-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/card-choice/choosing-card-widget-wrapper.component.scss'],
	template: `
		<ng-container *ngIf="showWidget$ | async">
			<div
				class="choosing-card-container items-{{ value.options?.length }}"
				*ngIf="{ options: options$ | async } as value"
			>
				<ng-container [ngSwitch]="widgetType$ | async">
					<ng-container *ngSwitchCase="'normal'">
						<choosing-card-option
							class="option-container"
							*ngFor="let option of value.options"
							[option]="option"
						></choosing-card-option>
					</ng-container>
					<ng-container *ngSwitchCase="'bgsQuest'">
						<choosing-card-bgs-quest-option
							class="option-container"
							*ngFor="let option of value.options"
							[option]="option"
						></choosing-card-bgs-quest-option>
					</ng-container>
				</ng-container>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingCardWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number, dpi: number) => 0;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number, dpi: number) => gameHeight * 0.28;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.board-container')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;
	options$: Observable<readonly CardChoiceOption[]>;
	widgetType$: Observable<'normal' | 'bgsQuest'>;

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
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	ngAfterContentInit(): void {
		this.showWidget$ = combineLatest([
			this.store.listen$(
				([main, nav, prefs]) => main.currentScene,
				// Show from prefs
				([main, nav, prefs]) => prefs.overlayEnableDiscoverHelp,
			),
			this.store.listenDeckState$((deckState) => deckState?.playerDeck?.currentOptions),
		]).pipe(
			this.mapData(([[currentScene, displayFromPrefs], [currentOptions]]) => {
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

				return true;
			}),
			this.handleReposition(),
		);

		const bgsQuests$$ = new BehaviorSubject<BgsQuestStats>(null);

		let subscribedToQuests = false;
		const bgsState$$ = new BehaviorSubject<BattlegroundsState>(null);
		this.store
			.listenBattlegrounds$(([state]) => state)
			.pipe(this.mapData(([state]) => state))
			.subscribe((state) => {
				if (state?.currentGame?.hasQuests && !subscribedToQuests) {
					// Only subscribe to the quests if quests are active, so that we don't get data uselessly
					this.store.bgsQuests$().subscribe((quests) => bgsQuests$$.next(quests));
					subscribedToQuests = true;
				}
				bgsState$$.next(state);
			});

		this.options$ = combineLatest([
			this.store.listenDeckState$((state) => state),
			this.store.enablePremiumFeatures$(),
			this.listenForBasicPref$((prefs) => prefs.bgsShowQuestStatsOverlay),
		]).pipe(
			this.mapData(([[state], premium, bgsShowQuestStatsOverlay]) => {
				const options = state.playerDeck?.currentOptions;
				console.debug('[choosing-card] options', options, state);
				return (
					options
						?.map((o) => {
							const isBaseDiscover = o.source !== CardIds.DiscoverQuestRewardDntToken;
							if (isBaseDiscover) {
								const result: CardChoiceOption = {
									cardId: o.cardId,
									entityId: o.entityId,
									flag: this.buildFlag(o, state),
									value: buildBasicCardChoiceValue(o, state, this.allCards, this.i18n),
								};
								return result;
							}

							if (!FeatureFlags.ENABLE_BGS_QUESTS || !premium || !bgsShowQuestStatsOverlay) {
								return null;
							}

							const optionInfo = buildBgsQuestCardChoiceValue(
								o,
								bgsState$$.getValue(),
								bgsQuests$$.getValue(),
								this.allCards,
							);
							if (!optionInfo) {
								console.warn('[choosing-card] could not find option info', o);
								return null;
							}

							const result: BgsQuestCardChoiceOption = {
								cardId: o.cardId,
								entityId: o.entityId,
								flag: this.buildFlag(o, state),
								questCompletionTurns: optionInfo.questCompletionTurns.toFixed(1),
								rewardAveragePosition: optionInfo.rewardAveragePosition.toFixed(2),
								rewardTier: optionInfo.rewardTier,
								questTooltip: this.i18n.translateString(
									'battlegrounds.in-game.quests.turn-to-complete-tooltip',
									{
										averageTurnsToComplete: optionInfo.averageTurnsToComplete?.toFixed(1),
										turnsToCompleteForHero: optionInfo.turnsToCompleteForHero?.toFixed(1),
										turnsToCompleteImpact: optionInfo.turnsToCompleteImpact?.toFixed(1),
									},
								),
								rewardTooltip: this.i18n.translateString(
									'battlegrounds.in-game.quests.reward-position-tooltip',
								),
							};
							return result;
						})
						.filter((o) => !!o) ?? []
				);
			}),
		);
		this.widgetType$ = this.store
			.listenDeckState$((state) => state.playerDeck?.currentOptions)
			.pipe(
				this.mapData(([options]) =>
					options?.some((o) => o.source === CardIds.DiscoverQuestRewardDntToken) ? 'bgsQuest' : 'normal',
				),
			);
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

	protected async doResize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.height;
		this.windowWidth = gameHeight * 1.12;
		this.windowHeight = gameHeight * 0.4;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

@Component({
	selector: 'choosing-card-option',
	styleUrls: ['../../../../css/component/overlays/card-choice/choosing-card-widget-wrapper.component.scss'],
	template: `
		<div class="option" (mouseenter)="onMouseEnter($event)" (mouseleave)="onMouseLeave($event)">
			<div class="flag-container" *ngIf="showFlag">
				<div class="flag" [inlineSVG]="'assets/svg/new_record.svg'"></div>
			</div>
			<div class="flag-container value-container" *ngIf="showValue">
				<div class="value">
					{{ value }}
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingCardOptionComponent {
	@Input() set option(value: CardChoiceOption) {
		this._option = value;
		this._referenceCard = this.allCards.getCard(value?.cardId);
		this.shouldHighlight = !NO_HIGHLIGHT_CARD_IDS.includes(value?.cardId as CardIds);

		this.showFlag = value?.flag === 'flag';
		this.showValue = value?.flag === 'value';
		this.value = value.value;
		// this.tooltip = value.tooltip;
		this.registerHighlight();
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

	constructor(
		private readonly cardsHighlightService: CardsHighlightFacadeService,
		private readonly allCards: CardsFacadeService,
	) {}

	registerHighlight() {
		this._uniqueId && this.cardsHighlightService.unregister(this._uniqueId, this.side);
		this._uniqueId = this._uniqueId || uuid();
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
}

@Component({
	selector: 'choosing-card-bgs-quest-option',
	styleUrls: ['../../../../css/component/overlays/card-choice/choosing-card-widget-wrapper.component.scss'],
	template: `
		<div class="option tall-option">
			<div class="flag-container value-container reward-tier" [helpTooltip]="rewardTooltip">
				<!-- <div class="tier">
					{{ rewardTier }}
				</div> -->
				<div class="average-position value">
					{{ rewardAveragePosition }}
				</div>
			</div>
			<div class="flag-container value-container quest-completion" [helpTooltip]="questTooltip">
				<div class="value">
					{{ questCompletionTurns }}
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingCardBgsQuestOptionComponent {
	@Input() set option(value: CardChoiceOption) {
		const castValue: BgsQuestCardChoiceOption = value as BgsQuestCardChoiceOption;
		this._option = castValue;
		this.questCompletionTurns = castValue.questCompletionTurns;
		this.rewardTier = castValue.rewardTier;
		this.rewardAveragePosition = castValue.rewardAveragePosition;
		this.questTooltip = castValue.questTooltip;
		this.rewardTooltip = castValue.rewardTooltip;
	}

	_option: BgsQuestCardChoiceOption;
	questCompletionTurns: string;
	rewardAveragePosition: string;
	rewardTier: string;
	questTooltip: string;
	rewardTooltip: string;

	constructor(private readonly allCards: CardsFacadeService) {}
}

// For discovers for which knowing the effect on your deck isn't relevant
const NO_HIGHLIGHT_CARD_IDS = [CardIds.MurlocHolmes_REV_022, CardIds.MurlocHolmes_REV_770];

export interface CardChoiceOption {
	readonly cardId: string;
	readonly entityId: number;
	readonly flag?: CardOptionFlag;
	readonly value?: string;
}

export interface BgsQuestCardChoiceOption extends CardChoiceOption {
	readonly questCompletionTurns: string;
	readonly rewardTier: string;
	readonly rewardAveragePosition: string;
	readonly questTooltip?: string;
	readonly rewardTooltip?: string;
}

export type CardOptionFlag = 'flag' | 'value' | null;
