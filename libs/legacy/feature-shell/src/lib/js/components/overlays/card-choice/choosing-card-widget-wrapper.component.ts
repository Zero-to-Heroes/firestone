/* eslint-disable @typescript-eslint/no-empty-function */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { CardClass, CardIds, GameTag, GameType, SceneMode } from '@firestone-hs/reference-data';
import { BattlegroundsQuestsService } from '@firestone/battlegrounds/common';
import { CardOption, DeckCard, GameState, GameStateFacadeService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, shareReplay, takeUntil } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';
import { buildBasicCardChoiceValue } from './card-choice-values';

@Component({
	selector: 'choosing-card-widget-wrapper',
	styleUrls: ['./choosing-card-widget-wrapper.component.scss'],
	template: `
		<div class="container" *ngIf="showWidget$ | async" [ngClass]="{ tall: hasTallCard$ | async }">
			<div
				class="choosing-card-container items-{{ value.options?.length }}"
				*ngIf="{ options: options$ | async } as value"
			>
				<ng-container [ngSwitch]="gameMode$ | async">
					<ng-container *ngSwitchCase="'arena'">
						<choosing-card-option-arena
							class="option-container"
							*ngFor="let option of value.options"
							[option]="option"
							[playerClass]="playerClass$ | async"
						></choosing-card-option-arena>
					</ng-container>
					<ng-container *ngSwitchCase="'constructed'">
						<choosing-card-option-constructed
							class="option-container"
							*ngFor="let option of value.options"
							[option]="option"
							[opponentClass]="opponentClass$ | async"
						></choosing-card-option-constructed>
					</ng-container>
					<ng-container *ngSwitchDefault>
						<choosing-card-option
							class="option-container"
							*ngFor="let option of value.options"
							[option]="option"
						></choosing-card-option>
					</ng-container>
				</ng-container>
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
	hasTallCard$: Observable<boolean>;
	gameMode$: Observable<'arena' | 'battlegrounds' | 'constructed' | null>;
	playerClass$: Observable<string | null>;
	opponentClass$: Observable<string | null>;
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
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.quests, this.gameState);

		this.gameMode$ = this.gameState.gameState$$.pipe(
			this.mapData((state) => {
				switch (state?.metadata?.gameType) {
					case GameType.GT_ARENA:
						return 'arena' as const;
					case GameType.GT_CASUAL:
					case GameType.GT_RANKED:
					case GameType.GT_VS_AI:
					case GameType.GT_VS_FRIEND:
						return 'constructed' as const;
					default:
						return null;
				}
			}),
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
		this.opponentClass$ = this.gameState.gameState$$.pipe(
			this.mapData((state) =>
				state?.opponentDeck?.hero?.classes?.[0]
					? CardClass[state.opponentDeck.hero.classes[0]].toLowerCase()
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
				console.debug('[choosing-card-widget] options', options);
				return options?.map((o) => {
					const refEntity = state.fullGameState?.Player?.AllEntities?.find((e) => e.entityId === o.entityId);
					const isTallCard = refEntity?.tags.some(
						(t) => t.Name === GameTag.IS_NIGHTMARE_BONUS && t.Value === 1,
					);
					const result: CardChoiceOption = {
						cardId: o.cardId,
						entityId: o.entityId,
						isTallCard: isTallCard,
						flag: this.buildFlag(o, state),
						value: buildBasicCardChoiceValue(o, state, this.allCards, this.i18n),
					};
					return result;
				});
			}),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			takeUntil(this.destroyed$),
		);
		this.hasTallCard$ = this.options$.pipe(this.mapData((options) => options.some((o) => o.isTallCard)));

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

// For discovers for which knowing the effect on your deck isn't relevant
export const NO_HIGHLIGHT_CARD_IDS = [CardIds.MurlocHolmes_REV_022, CardIds.MurlocHolmes_REV_770];

export interface CardChoiceOption {
	readonly cardId: string;
	readonly entityId: number;
	readonly isTallCard: boolean;
	readonly flag?: CardOptionFlag;
	readonly value?: string;
}

export type CardOptionFlag = 'flag' | 'value' | null;
