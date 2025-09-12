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
			[value]="initialSearchValue"
			(fsModelUpdate)="onTextChanged($event)"
			[placeholder]="'app.collection.card-search.search-box-placeholder' | fsTranslate"
			[tooltip]="'app.arena.card-search-tooltip' | fsTranslate"
		>
		</fs-text-input>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardSearchComponent implements AfterViewInit, OnDestroy {
	initialSearchValue: string | null = null;
	private destroyed$ = new Subject<void>();
	private searchSubject$ = new Subject<string>();

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
		// Clear the initial value after first user interaction to prevent future conflicts
		if (this.initialSearchValue !== null) {
			this.initialSearchValue = null;
		}
		this.cardsService.newSearchString(newText);
		this.searchSubject$.next(newText);
	}

	private initializeFromUrlParams(): void {
		this.route?.queryParams.pipe(take(1)).subscribe((params) => {
			const searchParam = params['arenaCardSearch'];
			if (searchParam && typeof searchParam === 'string') {
				this.initialSearchValue = searchParam;
				this.cardsService.newSearchString(searchParam);
				this.cdr.detectChanges();
			}
		});
	}

	private setupUrlParamSync(): void {
		this.searchSubject$.pipe(takeUntil(this.destroyed$)).subscribe((searchString) => {
			this.updateUrlParam(searchString);
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
	}
}
