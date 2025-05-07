import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { BgsBoardHighlighterService, BgsInGameCompositionsService } from '@firestone/battlegrounds/common';
import { ExtendedBgsCompAdvice, ExtendedReferenceCard } from '@firestone/battlegrounds/core';
import { BgsCompositionsListMode } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable, startWith } from 'rxjs';

@Component({
	selector: 'bgs-minions-list-composition',
	styleUrls: [`./bgs-minions-list-composition.component.scss`],
	template: `
		<ng-container
			*ngIf="{
				collapsed: collapsed$ | async,
				displayMode: displayMode$ | async,
				highlightedMinions: highlightedMinions$ | async
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
							inShop: minionsInShop?.includes(minion.id)
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

	@Input() set composition(value: ExtendedBgsCompAdvice) {
		console.debug('[bgs-minions-list-composition] setting composition', value);
		this.compId$$.next(value.compId);
		this.name = value.name;
		this.powerLevel = value.powerLevel;
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
}
