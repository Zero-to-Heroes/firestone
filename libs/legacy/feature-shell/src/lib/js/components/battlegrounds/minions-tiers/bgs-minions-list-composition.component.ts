import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { BgsCompTip } from '@firestone-hs/content-craetor-input';
import { GameTag, normalizeMinionCardId, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { BgsBoardHighlighterService, BgsInGameCompositionsService } from '@firestone/battlegrounds/common';
import { ExtendedBgsCompAdvice, ExtendedReferenceCard, isCardOrSubstitute } from '@firestone/battlegrounds/core';
import { BgsCompositionsListMode } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable, startWith } from 'rxjs';

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
							controlled: minionsOnBoardAndHand?.includes(minion.id),
							inShop: minionsInShop?.includes(minion.id),
						}"
						[minion]="minion"
						[showGoldenCards]="showGoldenCards"
						[showTrinketTips]="showTrinketTips"
						[highlightedMinions]="value.highlightedMinions"
						[highlightedTribes]="highlightedTribes"
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
						[highlightedMechanics]="highlightedMechanics"
						[fadeHigherTierCards]="fadeHigherTierCards"
						[showTribesHighlight]="showTribesHighlight"
						[showTavernTierIcon]="true"
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
						[highlightedMechanics]="highlightedMechanics"
						[fadeHigherTierCards]="fadeHigherTierCards"
						[showTribesHighlight]="showTribesHighlight"
						[showTavernTierIcon]="true"
						[leftPadding]="20"
					></bgs-minion-item>
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

	name: string;
	powerLevel: string;
	headerImages: readonly string[] = [];
	coreCards: readonly ExtendedReferenceCard[];
	addonCards: readonly ExtendedReferenceCard[];
	cycleCards: readonly ExtendedReferenceCard[];
	trinkets: readonly ExtendedReferenceCard[];
	enablerCards: readonly ExtendedReferenceCard[];
	tips: BgsCompTip[];
	author: string;
	difficulty: string;
	difficultyClass: string;

	@Input() set composition(value: ExtendedBgsCompAdvice) {
		console.debug('[bgs-minions-list-composition] setting composition', value);
		this.compId$$.next(value.compId);
		this.name = value.name;
		this.powerLevel = value.powerLevel;
		this.tips = value.tips;
		this.coreCards = value.cards
			.filter((c) => c.status === 'CORE')
			.map((c) => {
				const ref: ReferenceCard = this.allCards.getCard(c.cardId);
				const result: ExtendedReferenceCard = {
					...ref,
				};
				return result;
			});
		this.addonCards = value.cards
			.filter((c) => c.status === 'ADDON')
			.map((c) => {
				const ref: ReferenceCard = this.allCards.getCard(c.cardId);
				const result: ExtendedReferenceCard = {
					...ref,
				};
				return result;
			});
		this.cycleCards = value.cards
			.filter((c) => c.status === 'CYCLE')
			.map((c) => {
				const ref: ReferenceCard = this.allCards.getCard(c.cardId);
				const result: ExtendedReferenceCard = {
					...ref,
				};
				return result;
			});
		this.trinkets = value.cards
			.filter((c) => c.status === 'TRINKET')
			.map((c) => {
				const ref: ReferenceCard = this.allCards.getCard(c.cardId);
				const result: ExtendedReferenceCard = {
					...ref,
				};
				return result;
			});
		this.enablerCards = value.cards
			.filter((c) => c.status === 'ENABLER')
			.map((c) => {
				const ref: ReferenceCard = this.allCards.getCard(c.cardId);
				const result: ExtendedReferenceCard = {
					...ref,
				};
				return result;
			});
		this.headerImages = [`https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.minionIcon}.jpg`];
		this.compCards$$.next([...(this.coreCards ?? []), ...(this.addonCards ?? [])]);
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
	) {
		super(cdr);
	}

	ngAfterContentInit() {
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

		// this.displayMode$ = this.displayMode$$.pipe(this.mapData((mode) => mode));
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
		if (!this.coreCards?.length || !this.addonCards?.length) {
			return;
		}
		this.highlighter.toggleMinionsToHighlight([
			...this.coreCards.map((c) => c.id),
			...this.addonCards.map((c) => c.id),
		]);
	}

	isIncluded(minionsOnBoardAndHand: readonly string[], minionId: string) {
		const normalizedMinionsOnBoard = minionsOnBoardAndHand?.map((id) => normalizeMinionCardId(id, this.allCards));
		const normalizedMinionId = normalizeMinionCardId(minionId, this.allCards);
		return normalizedMinionsOnBoard?.some((id) => isCardOrSubstitute(normalizedMinionId, id));
	}
}
