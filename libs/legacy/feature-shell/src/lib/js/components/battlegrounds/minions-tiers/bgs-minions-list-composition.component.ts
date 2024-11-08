import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { BgsInGameCompositionsService } from '@firestone/battlegrounds/common';
import { ExtendedBgsCompAdvice, ExtendedReferenceCard } from '@firestone/battlegrounds/core';
import { BgsCompositionsListMode } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable, startWith } from 'rxjs';

@Component({
	selector: 'bgs-minions-list-composition',
	styleUrls: [`./bgs-minions-list-composition.component.scss`],
	template: `
		<ng-container *ngIf="{ collapsed: collapsed$ | async, displayMode: displayMode$ | async } as value">
			<div class="composition {{ value.displayMode ?? '' }}" [ngClass]="{ collapsed: value.collapsed }">
				<div class="header" (click)="toggleCollapsed()">
					<div class="header-images" *ngIf="!!headerImages?.length">
						<img *ngFor="let img of headerImages" class="header-image" [src]="img" />
					</div>
					<div class="header-text">{{ name }}</div>
					<div class="caret" inlineSVG="assets/svg/caret.svg"></div>
				</div>
				<!-- <div
					class="cards enablers"
					*ngIf="(!value.collapsed || value.displayMode === 'exploring') && enablerCards?.length"
				>
					<div class="header" *ngIf="!value.collapsed || value.displayMode !== 'exploring'">
						<div class="header-text">Enablers</div>
					</div>
					<bgs-minion-item
						class="minion"
						*ngFor="let minion of enablerCards; trackBy: trackByFn"
						[ngClass]="{
							controlled: minionsOnBoardAndHand?.includes(minion.id),
							inShop: minionsInShop?.includes(minion.id)
						}"
						[minion]="minion"
						[showGoldenCards]="showGoldenCards"
						[showTrinketTips]="showTrinketTips"
						[highlightedMinions]="highlightedMinions"
						[highlightedTribes]="highlightedTribes"
						[highlightedMechanics]="highlightedMechanics"
						[showTribesHighlight]="showTribesHighlight"
						[showTavernTierIcon]="true"
						[leftPadding]="20"
					></bgs-minion-item>
				</div> -->
				<div class="cards core" *ngIf="!value.collapsed && coreCards?.length">
					<div class="header">
						<div
							class="header-text"
							[fsTranslate]="'battlegrounds.in-game.minions-list.compositions.core-cards-header'"
						></div>
					</div>
					<bgs-minion-item
						class="minion"
						*ngFor="let minion of coreCards; trackBy: trackByFn"
						[minion]="minion"
						[showGoldenCards]="showGoldenCards"
						[showTrinketTips]="showTrinketTips"
						[highlightedMinions]="highlightedMinions"
						[highlightedTribes]="highlightedTribes"
						[highlightedMechanics]="highlightedMechanics"
						[showTribesHighlight]="showTribesHighlight"
						[showTavernTierIcon]="true"
						[leftPadding]="20"
					></bgs-minion-item>
				</div>
				<div class="cards addons" *ngIf="!value.collapsed && addonCards?.length">
					<div class="header">
						<div
							class="header-text"
							[fsTranslate]="'battlegrounds.in-game.minions-list.compositions.add-ons-header'"
						></div>
					</div>
					<bgs-minion-item
						class="minion"
						*ngFor="let minion of addonCards; trackBy: trackByFn"
						[minion]="minion"
						[showGoldenCards]="showGoldenCards"
						[showTrinketTips]="showTrinketTips"
						[highlightedMinions]="highlightedMinions"
						[highlightedTribes]="highlightedTribes"
						[highlightedMechanics]="highlightedMechanics"
						[showTribesHighlight]="showTribesHighlight"
						[showTavernTierIcon]="true"
						[fadeHigherTierCards]="fadeHigherTierCards"
						[tavernTier]="tavernTier"
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

	name: string;
	headerImages: readonly string[] = [];
	coreCards: readonly ExtendedReferenceCard[];
	addonCards: readonly ExtendedReferenceCard[];
	enablerCards: readonly ExtendedReferenceCard[];

	@Input() set composition(value: ExtendedBgsCompAdvice) {
		this.compId$$.next(value.compId);
		this.name = value.name;
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
	}

	@Input() set displayMode(value: BgsCompositionsListMode) {
		this.displayMode$$.next(value);
	}

	@Input() highlightedTribes: readonly Race[];
	@Input() showGoldenCards: boolean;
	@Input() showTrinketTips: boolean;
	@Input() highlightedMinions: readonly string[];
	@Input() highlightedMechanics: readonly GameTag[];
	@Input() showTribesHighlight: boolean;
	@Input() minionsOnBoardAndHand: readonly string[];
	@Input() minionsInShop: readonly string[];
	@Input() fadeHigherTierCards: boolean;
	@Input() tavernTier: number;

	private compId$$ = new BehaviorSubject<string | null>(null);
	private displayMode$$ = new BehaviorSubject<BgsCompositionsListMode>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly controller: BgsInGameCompositionsService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.collapsed$ = combineLatest([this.controller.expandedCompositions$$, this.compId$$]).pipe(
			this.mapData(([expandedIds, compId]) => !expandedIds.includes(compId)),
			startWith(true),
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
}
