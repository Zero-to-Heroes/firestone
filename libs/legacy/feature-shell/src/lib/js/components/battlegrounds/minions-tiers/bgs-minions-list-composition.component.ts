import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	Input,
	ViewRef,
} from '@angular/core';
import { BgsCompTip } from '@firestone-hs/content-craetor-input';
import {
	CardRules,
	GameTag,
	hasCorrectTribe,
	normalizeMinionCardId,
	Race,
	ReferenceCard,
} from '@firestone-hs/reference-data';
import { ExtendedBgsCompAdvice, ExtendedReferenceCard, isCardOrSubstitute } from '@firestone/battlegrounds/core';
import {
	BgsBoardHighlighterService,
	BgsInGameCompositionsService,
	InGameFinalBoard,
} from '@firestone/battlegrounds/services';
import { GameStateFacadeService } from '@firestone/game-state';
import { BgsCompositionsListMode } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	AnalyticsService,
	CardRulesService,
	CardsFacadeService,
	IAdsService,
	ILocalizationService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable, startWith } from 'rxjs';

interface ProcessedInGameBoard {
	readonly mmr: number;
	readonly heroCardId: string;
	readonly heroName: string;
	readonly heroImage: string;
	readonly board: InGameFinalBoard['board'];
}

@Component({
	standalone: false,
	selector: 'bgs-minions-list-composition',
	styleUrls: [`./bgs-minions-list-composition.component.scss`],
	template: `
		<ng-container
			*ngIf="{
				collapsed: collapsed$ | async,
				displayMode: displayMode$ | async,
				highlightedMinions: highlightedMinions$ | async,
				exampleBoards: exampleBoards$ | async,
				isPremium: isPremium$ | async,
			} as value"
		>
			<div class="composition {{ value.displayMode ?? '' }}" [ngClass]="{ collapsed: value.collapsed }">
				<div class="header" (click)="toggleCollapsed()">
					<div class="header-images" *ngIf="!!headerImages?.length">
						<img *ngFor="let img of headerImages" class="header-image" [src]="img" />
					</div>
					<div class="header-power-level {{ powerLevel?.toLowerCase() }}">{{ powerLevel }}</div>
					<div class="header-text">{{ name }}</div>
					<div
						class="highlight-comp-button"
						[ngClass]="{ highlighted: isCompHighlighted$ | async }"
						inlineSVG="assets/svg/pinned.svg"
						(click)="highlightComp($event)"
						[helpTooltip]="'battlegrounds.in-game.minions-list.compositions.pin-tooltip' | fsTranslate"
						[helpTooltipPosition]="'left'"
					></div>
					<div class="caret" inlineSVG="assets/svg/caret.svg"></div>
				</div>
				<div class="pro-advice" *ngIf="!value.collapsed && tips.length">
					<div class="header">
						<div
							class="section-title-text"
							[fsTranslate]="'battlegrounds.in-game.minions-list.compositions.advice.how-to-play'"
						></div>
						<div
							class="difficulty {{ difficultyClass }}"
							[helpTooltip]="
								'battlegrounds.in-game.minions-list.compositions.advice.difficulty-tooltip'
									| fsTranslate
							"
						>
							{{ difficulty }}
						</div>
					</div>
					<div class="text-section how-to-play">
						<div class="how-to-play-text">{{ tips[0].tip }}</div>
					</div>
					<div class="header">
						<div
							class="section-title-text"
							[fsTranslate]="'battlegrounds.in-game.minions-list.compositions.advice.when-to-commit'"
						></div>
					</div>
					<div class="text-section when-to-commit">
						<div class="when-to-commit-text">{{ tips[0].whenToCommit }}</div>
					</div>
					<div class="footer">
						<div class="footer-text">{{ author }}</div>
						<div class="footer-date">{{ tips[0].date }}</div>
					</div>
				</div>
				<div class="cards core" *ngIf="!value.collapsed && coreCards?.length">
					<div class="header">
						<div
							class="header-text"
							[fsTranslate]="'battlegrounds.in-game.minions-list.compositions.core-cards-header'"
							[helpTooltip]="
								'battlegrounds.in-game.minions-list.compositions.core-cards-header-tooltip'
									| fsTranslate
							"
						></div>
					</div>
					<bgs-minion-item
						class="minion"
						*ngFor="let minion of coreCards; trackBy: trackByFn"
						[ngClass]="{
							controlled: isIncluded(minionsOnBoardAndHand, minion.id),
							inShop: isIncluded(minionsInShop, minion.id),
						}"
						[minion]="minion"
						[showGoldenCards]="showGoldenCards"
						[showTrinketTips]="showTrinketTips"
						[highlightedMinions]="value.highlightedMinions"
						[highlightedTribes]="highlightedTribes"
						[highlightedTiers]="highlightedTiers"
						[highlightedMechanics]="highlightedMechanics"
						[showTribesHighlight]="showTribesHighlight"
						[showTavernTierIcon]="true"
						[hideMechanicsHighlight]="true"
						[fadeHigherTierCards]="fadeHigherTierCards"
						[tavernTier]="tavernTier"
						[leftPadding]="20"
					></bgs-minion-item>
				</div>
				<div class="cards addons" *ngIf="!value.collapsed && addonCards?.length">
					<div class="header">
						<div
							class="header-text"
							[fsTranslate]="'battlegrounds.in-game.minions-list.compositions.add-ons-header'"
							[helpTooltip]="
								'battlegrounds.in-game.minions-list.compositions.add-ons-header-tooltip' | fsTranslate
							"
						></div>
					</div>
					<bgs-minion-item
						class="minion"
						*ngFor="let minion of addonCards; trackBy: trackByFn"
						[ngClass]="{
							controlled: isIncluded(minionsOnBoardAndHand, minion.id),
							inShop: isIncluded(minionsInShop, minion.id),
						}"
						[minion]="minion"
						[showGoldenCards]="showGoldenCards"
						[showTrinketTips]="showTrinketTips"
						[highlightedMinions]="value.highlightedMinions"
						[highlightedTribes]="highlightedTribes"
						[highlightedTiers]="highlightedTiers"
						[highlightedMechanics]="highlightedMechanics"
						[showTribesHighlight]="showTribesHighlight"
						[showTavernTierIcon]="true"
						[hideMechanicsHighlight]="true"
						[fadeHigherTierCards]="fadeHigherTierCards"
						[tavernTier]="tavernTier"
						[leftPadding]="20"
					></bgs-minion-item>
				</div>
				<div
					class="cards cycle"
					*ngIf="(!value.collapsed || value.displayMode === 'exploring') && cycleCards?.length"
				>
					<div class="header" *ngIf="!value.collapsed || value.displayMode !== 'exploring'">
						<div
							class="header-text"
							[fsTranslate]="'battlegrounds.in-game.minions-list.compositions.cycles-header'"
							[helpTooltip]="
								'battlegrounds.in-game.minions-list.compositions.cycles-header-tooltip' | fsTranslate
							"
						></div>
					</div>
					<bgs-minion-item
						class="minion"
						*ngFor="let minion of cycleCards; trackBy: trackByFn"
						[ngClass]="{
							controlled: minionsOnBoardAndHand?.includes(minion.id),
							inShop: minionsInShop?.includes(minion.id),
						}"
						[minion]="minion"
						[showGoldenCards]="showGoldenCards"
						[showTrinketTips]="showTrinketTips"
						[highlightedMinions]="value.highlightedMinions"
						[highlightedTribes]="highlightedTribes"
						[highlightedTiers]="highlightedTiers"
						[highlightedMechanics]="highlightedMechanics"
						[fadeHigherTierCards]="fadeHigherTierCards"
						[showTribesHighlight]="showTribesHighlight"
						[showTavernTierIcon]="true"
						[leftPadding]="20"
					></bgs-minion-item>
				</div>
				<div class="cards recommended" *ngIf="!value.collapsed && recommendedCards?.length">
					<div class="header">
						<div
							class="header-text"
							[fsTranslate]="'battlegrounds.in-game.minions-list.compositions.recommended-cards-header'"
							[helpTooltip]="
								'battlegrounds.in-game.minions-list.compositions.recommended-cards-header-tooltip'
									| fsTranslate
							"
						></div>
					</div>
					<bgs-minion-item
						class="minion"
						*ngFor="let minion of recommendedCards; trackBy: trackByFn"
						[ngClass]="{
							controlled: isIncluded(minionsOnBoardAndHand, minion.id),
							inShop: isIncluded(minionsInShop, minion.id),
						}"
						[minion]="minion"
						[showGoldenCards]="showGoldenCards"
						[showTrinketTips]="showTrinketTips"
						[highlightedMinions]="value.highlightedMinions"
						[highlightedTribes]="highlightedTribes"
						[highlightedTiers]="highlightedTiers"
						[highlightedMechanics]="highlightedMechanics"
						[showTribesHighlight]="showTribesHighlight"
						[showTavernTierIcon]="true"
						[hideMechanicsHighlight]="true"
						[fadeHigherTierCards]="fadeHigherTierCards"
						[tavernTier]="tavernTier"
						[leftPadding]="20"
					></bgs-minion-item>
				</div>
				<div
					class="cards trinket"
					*ngIf="(!value.collapsed || value.displayMode === 'exploring') && trinkets?.length"
				>
					<div class="header" *ngIf="!value.collapsed || value.displayMode !== 'exploring'">
						<div
							class="header-text"
							[fsTranslate]="'battlegrounds.in-game.minions-list.compositions.trinkets-header'"
							[helpTooltip]="
								'battlegrounds.in-game.minions-list.compositions.trinkets-header-tooltip' | fsTranslate
							"
						></div>
					</div>
					<bgs-minion-item
						class="minion"
						*ngFor="let minion of trinkets; trackBy: trackByFn"
						[minion]="minion"
						[showGoldenCards]="showGoldenCards"
						[showTrinketTips]="showTrinketTips"
						[highlightedMinions]="value.highlightedMinions"
						[highlightedTribes]="highlightedTribes"
						[highlightedTiers]="highlightedTiers"
						[highlightedMechanics]="highlightedMechanics"
						[fadeHigherTierCards]="fadeHigherTierCards"
						[showTribesHighlight]="showTribesHighlight"
						[showTavernTierIcon]="true"
						[leftPadding]="20"
					></bgs-minion-item>
				</div>
				<div class="example-boards-trigger" *ngIf="!value.collapsed && value.exampleBoards?.length">
					<div
						class="header example-boards-header"
						*ngIf="value.isPremium"
						(click)="toggleExampleBoards($event)"
					>
						<div
							class="header-text"
							[fsTranslate]="'app.battlegrounds.compositions.tabs.example-boards-header'"
						></div>
					</div>
					<div
						class="header example-boards-header locked"
						*ngIf="!value.isPremium"
						(click)="goToPremium($event)"
						[helpTooltip]="
							'app.battlegrounds.compositions.tabs.example-boards-locked-tooltip' | fsTranslate
						"
					>
						<div
							class="header-text"
							[fsTranslate]="'app.battlegrounds.compositions.tabs.example-boards-header'"
						></div>
						<span class="premium-lock" inlineSVG="assets/svg/lock.svg"></span>
					</div>
				</div>
			</div>

			<div
				class="example-boards-popup-overlay"
				*ngIf="showExampleBoards && value.isPremium && value.exampleBoards?.length"
				(click)="toggleExampleBoards($event)"
			>
				<div class="example-boards-popup" (click)="$event.stopPropagation()">
					<div class="popup-header">
						<h3 class="popup-title">{{ name }}</h3>
						<button
							class="close-button"
							(click)="toggleExampleBoards($event)"
							inlineSVG="assets/svg/close.svg"
						></button>
					</div>
					<div class="boards-list" scrollable>
						<div class="example-board" *ngFor="let board of value.exampleBoards">
							<div class="board-header">
								<img
									class="hero-portrait"
									[src]="board.heroImage"
									[cardTooltip]="board.heroCardId"
									[cardTooltipBgs]="true"
								/>
								<span class="hero-name">{{ board.heroName }}</span>
								<div class="mmr-badge">
									<span class="mmr-value">{{ board.mmr | number }}</span>
									<span class="mmr-label">MMR</span>
								</div>
							</div>
							<div class="board-minions">
								<div class="card-item" *ngFor="let entity of board.board">
									<card-on-board
										class="card"
										[entity]="entity"
										[cardTooltip]="entity.cardID"
										[cardTooltipBgs]="true"
									>
									</card-on-board>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsMinionsListCompositionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	collapsed$: Observable<boolean>;
	displayMode$: Observable<BgsCompositionsListMode>;
	highlightedMinions$: Observable<readonly string[]>;
	isCompHighlighted$: Observable<boolean>;
	exampleBoards$: Observable<readonly ProcessedInGameBoard[]>;
	isPremium$: Observable<boolean>;

	showExampleBoards = false;

	name: string;
	powerLevel: string;
	headerImages: readonly string[] = [];
	coreCards: readonly ExtendedReferenceCard[];
	recommendedCards: readonly ExtendedReferenceCard[];
	addonCards: readonly ExtendedReferenceCard[];
	cycleCards: readonly ExtendedReferenceCard[];
	trinkets: readonly ExtendedReferenceCard[];
	enablerCards: readonly ExtendedReferenceCard[];
	tips: BgsCompTip[];
	author: string;
	difficulty: string;
	difficultyClass: string;

	@Input() set composition(value: ExtendedBgsCompAdvice) {
		this.compId$$.next(value.compId);
		this.name = value.name;
		this.powerLevel = value.powerLevel;
		this.tips = value.tips;
		const getCardsByStatus = (status: string): readonly ExtendedReferenceCard[] => {
			return value.cards
				.filter((c) => c.status === status)
				.map((c) => {
					const ref: ReferenceCard = this.allCards.getCard(c.cardId);
					if (!ref.isBaconPool) {
						return null;
					}
					const result: ExtendedReferenceCard = {
						...ref,
					};
					return result;
				})
				.filter((c) => c !== null);
		};
		this.coreCards = getCardsByStatus('CORE');
		this.recommendedCards = getCardsByStatus('RECOMMENDED');
		this.addonCards = getCardsByStatus('ADDON');
		this.cycleCards = getCardsByStatus('CYCLE');
		this.trinkets = getCardsByStatus('TRINKET');
		this.enablerCards = getCardsByStatus('ENABLER');
		this.headerImages = [`https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.minionIcon}.jpg`];
		this.compCards$$.next([
			...(this.coreCards ?? []),
			...(this.addonCards ?? []),
			...(this.recommendedCards ?? []),
		]);
		this.author = this.i18n.translateString('battlegrounds.in-game.minions-list.compositions.advice.author', {
			author: value.tips?.[0]?.author ?? '',
		});
		this.difficulty = this.i18n.translateString(
			`battlegrounds.in-game.minions-list.compositions.difficulty.${value.difficulty
				?.replaceAll(' ', '-')
				?.toLowerCase()}`,
		);
		this.difficultyClass = value.difficulty?.toLowerCase() ?? '';
	}

	@Input() set highlightedMinions(value: readonly string[]) {
		this.highlightedMinions$$.next(value);
	}

	@Input() set displayMode(value: BgsCompositionsListMode) {
		this.displayMode$$.next(value);
	}

	@Input() highlightedTribes: readonly Race[];
	@Input() highlightedTiers: readonly number[];
	@Input() showGoldenCards: boolean;
	@Input() showTrinketTips: boolean;
	@Input() highlightedMechanics: readonly GameTag[];
	@Input() showTribesHighlight: boolean;
	@Input() minionsOnBoardAndHand: readonly string[];
	@Input() minionsInShop: readonly string[];
	@Input() fadeHigherTierCards: boolean;
	@Input() tavernTier: number;

	private compId$$ = new BehaviorSubject<string | null>(null);
	private displayMode$$ = new BehaviorSubject<BgsCompositionsListMode>(null);
	private compCards$$ = new BehaviorSubject<readonly ExtendedReferenceCard[]>([]);
	private highlightedMinions$$ = new BehaviorSubject<readonly string[]>([]);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly controller: BgsInGameCompositionsService,
		private readonly highlighter: BgsBoardHighlighterService,
		private readonly i18n: ILocalizationService,
		private readonly analytics: AnalyticsService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly gameState: GameStateFacadeService,
		private readonly cardRules: CardRulesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.gameState, this.cardRules);

		this.collapsed$ = combineLatest([this.controller.expandedCompositions$$, this.compId$$]).pipe(
			this.mapData(([expandedIds, compId]) => !expandedIds.includes(compId)),
			startWith(true),
		);
		this.highlightedMinions$ = this.highlightedMinions$$.pipe(this.mapData((minions) => minions));
		this.isCompHighlighted$ = combineLatest([this.compCards$$, this.highlightedMinions$$]).pipe(
			this.mapData(([cards, highlightedMinions]) => {
				if (!cards?.length || !highlightedMinions?.length) {
					return false;
				}
				return cards.every((c) => highlightedMinions.includes(c.id));
			}),
		);
		const tribesInGame$ = this.gameState.gameState$$.pipe(
			this.mapData((state) => state.bgState.currentGame?.availableRaces),
		);
		this.exampleBoards$ = combineLatest([
			this.controller.finalBoardsByCompId$$,
			this.compId$$,
			tribesInGame$,
			this.cardRules.rules$$,
		]).pipe(
			this.mapData(([boardsMap, compId, tribesInGame, cardRules]) => {
				if (!compId || !boardsMap?.size) {
					return [];
				}
				const boards = boardsMap.get(compId);
				if (!boards?.length) {
					return [];
				}
				console.debug('[debug] all boardsboards', boards);
				const validBoardsForLobby = boards.filter((b) =>
					isValidBoardForLobby(b, tribesInGame, this.allCards, cardRules),
				);
				console.debug('[debug] valid boards for lobby', validBoardsForLobby);
				console.debug(
					'[debug] invalid boards for lobby',
					boards.filter((b) => !isValidBoardForLobby(b, tribesInGame, this.allCards, cardRules)),
				);
				return validBoardsForLobby.slice(0, 10).map((b) => ({
					mmr: Math.round(b.mmr / 500) * 500,
					heroCardId: b.heroCardId,
					heroName: this.allCards.getCard(b.heroCardId)?.name ?? b.heroCardId,
					heroImage: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${b.heroCardId}.jpg`,
					board: b.board,
				}));
			}),
		);
		this.isPremium$ = this.ads.enablePremiumFeatures$$.pipe(this.mapData((premium) => premium));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	trackByFn(index: number, minion: ExtendedReferenceCard) {
		return minion.id;
	}

	toggleCollapsed() {
		const currentlyExpanded = this.controller.expandedCompositions$$.value;
		const newExpanded = currentlyExpanded.includes(this.compId$$.value)
			? currentlyExpanded.filter((id) => id !== this.compId$$.value)
			: [...currentlyExpanded, this.compId$$.value];
		this.controller.expandedCompositions$$.next(newExpanded);
	}

	highlightComp(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		console.debug('[debug] highlightComp', this.coreCards, this.addonCards, this.recommendedCards);
		if (!this.coreCards?.length && !this.addonCards?.length && !this.recommendedCards?.length) {
			return;
		}
		this.highlighter.toggleMinionsToHighlight([
			...this.coreCards.map((c) => c.id),
			...this.addonCards.map((c) => c.id),
			...this.recommendedCards.map((c) => c.id),
		]);
	}

	toggleExampleBoards(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.showExampleBoards = !this.showExampleBoards;
	}

	goToPremium(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.analytics.trackEvent('subscription-click', { page: 'bgs-in-game-example-boards' });
		this.ads.goToPremium();
	}

	isIncluded(minionsOnBoardAndHand: readonly string[], minionId: string) {
		const getBaseCard = (cardId: string) => {
			const card = this.allCards.getCard(cardId);
			return card.premium ? this.allCards.getCard(card.battlegroundsNormalDbfId || 0) : card;
		};
		const normalizedMinionId = normalizeMinionCardId(getBaseCard(minionId).id, this.allCards);
		const normalizedMinionsOnBoard = minionsOnBoardAndHand?.map((id) =>
			normalizeMinionCardId(getBaseCard(id).id, this.allCards),
		);
		return normalizedMinionsOnBoard?.some((id) => isCardOrSubstitute(normalizedMinionId, id));
	}
}

const isValidBoardForLobby = (
	board: InGameFinalBoard,
	tribesInGame: readonly Race[],
	allCards: CardsFacadeService,
	cardRules: CardRules,
): boolean => {
	if (!tribesInGame?.length) {
		return true;
	}

	return board.board.every((entity) => {
		const card = allCards.getCard(entity.cardID);
		return isValidCardForTribes(card.id, tribesInGame, allCards, cardRules);
	});
};
const isValidCardForTribes = (
	cardId: string,
	tribesInGame: readonly Race[],
	allCards: CardsFacadeService,
	cardRules: CardRules,
): boolean => {
	const card = allCards.getCard(cardId);
	if (tribesInGame.some((t) => hasCorrectTribe(card, t))) {
		return true;
	}

	if (!cardRules) {
		return false;
	}

	const rule = cardRules[cardId];
	if (!rule) {
		return false;
	}
	return rule.bgsMinionTypesRules?.needTypesInLobby?.every((tribe) => tribesInGame.includes(Race[tribe]));
};
