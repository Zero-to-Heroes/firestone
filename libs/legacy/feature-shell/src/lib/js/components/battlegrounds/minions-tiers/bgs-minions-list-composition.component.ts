import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { BgsInGameCompositionsService } from '@firestone/battlegrounds/common';
import { ExtendedReferenceCard } from '@firestone/battlegrounds/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable, tap } from 'rxjs';

@Component({
	selector: 'bgs-minions-list-composition',
	styleUrls: [`./bgs-minions-list-composition.component.scss`],
	template: `
		<div class="composition" [ngClass]="{ collapsed: collapsed$ | async }">
			<div class="header" (click)="toggleCollapsed()">
				<div class="header-text">{{ name }}</div>
			</div>
			<div class="cards core">
				<div class="header">
					<div class="header-text">Core cards</div>
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
				></bgs-minion-item>
			</div>
			<div class="cards addons">
				<div class="header">
					<div class="header-text">Add-ons</div>
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
				></bgs-minion-item>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsMinionsListCompositionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	collapsed$: Observable<boolean>;

	name: string;
	coreCards: readonly ExtendedReferenceCard[];
	addonCards: readonly ExtendedReferenceCard[];

	@Input() set composition(value: BgsCompAdvice) {
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
	}

	@Input() highlightedTribes: readonly Race[];
	@Input() showGoldenCards: boolean;
	@Input() showTrinketTips: boolean;
	@Input() highlightedMinions: readonly string[];
	@Input() highlightedMechanics: readonly GameTag[];
	@Input() showTribesHighlight: boolean;

	private compId$$ = new BehaviorSubject<string | null>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly controller: BgsInGameCompositionsService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.collapsed$ = combineLatest([this.controller.expandedCompositions$$, this.compId$$]).pipe(
			tap(([expandedIds, compId]) =>
				console.debug('setting collapsed 1', expandedIds, compId, expandedIds.includes(compId)),
			),
			this.mapData(([expandedIds, compId]) => !expandedIds.includes(compId)),
			tap((collapsed) => console.debug('setting collapsed 2', collapsed)),
		);
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
