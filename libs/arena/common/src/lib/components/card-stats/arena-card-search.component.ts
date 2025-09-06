import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	Optional,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, take, takeUntil } from 'rxjs';
import { ArenaCardStatsService } from '../../services/arena-card-stats.service';

@Component({
	standalone: false,
	selector: 'arena-card-search',
	styleUrls: [`./arena-card-search.component.scss`],
	template: `
		<fs-text-input
			[value]="currentSearchString"
			(fsModelUpdate)="onTextChanged($event)"
			[placeholder]="'app.collection.card-search.search-box-placeholder' | fsTranslate"
			[tooltip]="'app.arena.card-search-tooltip' | fsTranslate"
		>
		</fs-text-input>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardSearchComponent implements AfterViewInit, OnDestroy {
	currentSearchString = '';
	private destroyed$ = new Subject<void>();

	constructor(
		private readonly cardsService: ArenaCardStatsService,
		private readonly cdr: ChangeDetectorRef,
		@Optional() private readonly route: ActivatedRoute,
		@Optional() private readonly router: Router,
	) {}

	ngAfterViewInit() {
		// Initialize from URL parameters
		this.initializeFromUrlParams();

		// Set up URL parameter synchronization
		this.setupUrlParamSync();
	}

	ngOnDestroy() {
		this.destroyed$.next();
		this.destroyed$.complete();
	}

	onTextChanged(newText: string) {
		this.currentSearchString = newText;
		this.cardsService.newSearchString(newText);
		this.updateUrlParam(newText);
	}

	private initializeFromUrlParams(): void {
		this.route?.queryParams.pipe(take(1)).subscribe((params) => {
			const searchParam = params['arenaCardSearch'];
			if (searchParam && typeof searchParam === 'string') {
				this.currentSearchString = searchParam;
				this.cardsService.newSearchString(searchParam);
				this.cdr.detectChanges();
				console.debug('[arena-card-search] initialized from URL:', searchParam);
			}
		});
	}

	private setupUrlParamSync(): void {
		// Watch for search string changes from the service and update URL
		this.cardsService.searchString$$.pipe(takeUntil(this.destroyed$)).subscribe((searchString) => {
			if (!this.route || !this.router) {
				return;
			}
			if (searchString !== this.currentSearchString) {
				this.currentSearchString = searchString || '';
				this.updateUrlParam(this.currentSearchString);
				this.cdr.detectChanges();
			}
		});
	}

	private updateUrlParam(searchString: string): void {
		if (!this.route || !this.router) {
			return;
		}
		const queryParams: any = {};

		// Add parameter if it has content, or set to null to remove it
		if (searchString && searchString.trim().length > 0) {
			queryParams.arenaCardSearch = searchString.trim();
		} else {
			queryParams.arenaCardSearch = null;
		}

		// Update URL without triggering navigation
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams,
			queryParamsHandling: 'merge',
			replaceUrl: true,
		});

		console.debug('[arena-card-search] updated URL param:', queryParams);
	}
}
