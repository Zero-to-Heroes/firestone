import { AfterViewInit, ChangeDetectionStrategy, Component, HostListener, Input, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FilterShownAchievementsEvent } from '../../services/mainwindow/store/events/achievements/filter-shown-achievements-event';

@Component({
	standalone: false,
	selector: 'achievements-filter',
	styleUrls: [`../../../css/component/achievements/achievements-filter.component.scss`],
	template: `
		<div class="achievement-filter">
			<label class="search-label">
				<i class="i-30" inlineSVG="assets/svg/search.svg"> </i>
				<input
					[formControl]="searchForm"
					(mousedown)="onMouseDown($event)"
					[(ngModel)]="searchString"
					[placeholder]="'app.achievements.search-placeholder' | owTranslate"
				/>
			</label>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsFilterComponent implements AfterViewInit, OnDestroy {
	@Input() searchString: string;
	searchForm = new FormControl();

	private subscription: Subscription;

	constructor(private readonly mainWindowStateFacade: MainWindowStateFacadeService) {}

	ngAfterViewInit() {
		this.subscription = this.searchForm.valueChanges
			.pipe(debounceTime(400))
			.pipe(distinctUntilChanged())
			.subscribe((data) => {
				this.onSearchStringChange();
			});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.subscription?.unsubscribe();
	}

	onSearchStringChange() {
		this.mainWindowStateFacade.send(new FilterShownAchievementsEvent(this.searchString));
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}
}
