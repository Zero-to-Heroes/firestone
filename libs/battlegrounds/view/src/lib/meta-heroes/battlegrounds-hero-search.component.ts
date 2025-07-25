import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Output,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
	standalone: false,
	selector: 'battlegrounds-hero-search',
	styleUrls: [`./battlegrounds-hero-search.component.scss`],
	template: `
		<div class="search">
			<label class="search-label">
				<i class="i-30" inlineSVG="assets/svg/search.svg"> </i>
				<input
					[formControl]="searchForm"
					(mousedown)="onMouseDown($event)"
					[(ngModel)]="searchString"
					[placeholder]="'app.duels.search.hero.placeholder' | fsTranslate"
				/>
			</label>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsHeroSearchComponent
	extends AbstractSubscriptionComponent
	implements AfterViewInit, OnDestroy
{
	@Output() searchStringChange = new EventEmitter<string>();

	@Input() searchString: string;

	searchForm = new FormControl();

	private searchFormSub$$: Subscription;

	constructor(protected override readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}

	ngAfterViewInit() {
		this.searchFormSub$$ = this.searchForm.valueChanges
			.pipe(debounceTime(200))
			.pipe(distinctUntilChanged())
			.subscribe((data) => {
				this.onSearchStringChange();
			});
	}

	@HostListener('window:beforeunload')
	override ngOnDestroy() {
		super.ngOnDestroy();
		this.searchFormSub$$?.unsubscribe();
	}

	onSearchStringChange() {
		this.searchStringChange.next(this.searchString);
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}
}
