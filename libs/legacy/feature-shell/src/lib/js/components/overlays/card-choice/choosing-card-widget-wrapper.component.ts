/* eslint-disable @typescript-eslint/no-empty-function */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { CardIds, GameType, ReferenceCard, SceneMode } from '@firestone-hs/reference-data';
import { BattlegroundsQuestsService } from '@firestone/battlegrounds/common';
import { CardOption, DeckCard, GameState } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { uuidShort } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { CardsHighlightFacadeService } from '../../../services/decktracker/card-highlight/cards-highlight-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';
import { buildBasicCardChoiceValue } from './card-choice-values';

@Component({
	selector: 'choosing-card-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/card-choice/choosing-card-widget-wrapper.component.scss'],
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
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await this.scene.isReady();
		await this.quests.isReady();

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
export class ChoosingCardOptionComponent implements OnDestroy {
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
