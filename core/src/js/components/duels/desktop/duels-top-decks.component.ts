import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DuelsGroupedDecks } from '../../../models/duels/duels-grouped-decks';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'duels-top-decks',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-top-decks.component.scss`,
	],
	template: `
		<div class="duels-runs-container">
			<infinite-scroll *ngIf="allDecks?.length" class="runs-list" (scrolled)="onScroll()" scrollable>
				<duels-grouped-top-decks
					*ngFor="let stat of displayedGroupedDecks"
					[groupedDecks]="stat"
				></duels-grouped-top-decks>
				<div class="loading" *ngIf="isLoading" [owTranslate]="'app.duels.run.load-more-button'"></div>
			</infinite-scroll>
			<duels-empty-state *ngIf="!allDecks?.length"></duels-empty-state>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTopDecksComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	isLoading: boolean;
	allDecks: readonly DuelsGroupedDecks[];
	displayedGroupedDecks: readonly DuelsGroupedDecks[];

	private sub$$: Subscription;
	private iterator: IterableIterator<void>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.sub$$ = this.store
			.duelsTopDecks$()
			.pipe(takeUntil(this.destroyed$))
			.subscribe((topDecks) => {
				// Otherwise the generator is simply closed at the end of the first onScroll call
				setTimeout(() => {
					this.displayedGroupedDecks = [];
					// One item is a full list of grouped replays for the day
					// So we don't want to be too aggressive with full runs
					this.iterator = this.buildIterator(topDecks, 4);

					this.onScroll();
				});
			});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.sub$$?.unsubscribe();
	}

	onScroll() {
		this.iterator && this.iterator.next();
	}

	private *buildIterator(topDecks: readonly DuelsGroupedDecks[], step = 10): IterableIterator<void> {
		this.allDecks = topDecks;
		const workingRuns = [...this.allDecks];
		const minShownReplays = 30;
		while (workingRuns.length > 0) {
			const currentRuns = [];
			while (
				workingRuns.length > 0 &&
				(currentRuns.length === 0 || this.getTotalRunsLength(currentRuns) < minShownReplays)
			) {
				currentRuns.push(...workingRuns.splice(0, 1));
			}
			this.displayedGroupedDecks = [...this.displayedGroupedDecks, ...currentRuns];
			this.isLoading = this.allDecks.length > step;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			yield;
		}
		this.isLoading = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		return;
	}

	private getTotalRunsLength(groups: readonly DuelsGroupedDecks[]): number {
		return groups ? groups.map((group) => group.decks).reduce((a, b) => a.concat(b), []).length : 0;
	}
}
