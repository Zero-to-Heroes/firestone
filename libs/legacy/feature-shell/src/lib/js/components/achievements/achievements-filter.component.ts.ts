import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FilterShownAchievementsEvent } from '../../services/mainwindow/store/events/achievements/filter-shown-achievements-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';

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

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private subscription: Subscription;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
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
		this.stateUpdater.next(new FilterShownAchievementsEvent(this.searchString));
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}
}
