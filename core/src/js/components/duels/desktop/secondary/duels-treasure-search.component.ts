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
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NavigationDuels } from '../../../../models/mainwindow/navigation/navigation-duels';
import { DuelsTreasureSearchEvent } from '../../../../services/mainwindow/store/events/duels/duels-treasure-search-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'duels-treasure-search',
	styleUrls: [`../../../../../css/component/duels/desktop/secondary/duels-treasure-search.component.scss`],
	template: `
		<div class="duels-treasure-search">
			<label class="search-label">
				<i class="i-30">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#search" />
					</svg>
				</i>
				<input
					[formControl]="searchForm"
					(mousedown)="onMouseDown($event)"
					[(ngModel)]="searchString"
					placeholder="Search treasure..."
				/>
			</label>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTreasureSearchComponent implements AfterViewInit, OnDestroy {
	@Input() set navigation(value: NavigationDuels) {
		this.searchString = value?.treasureSearchString;
	}

	searchString: string;
	searchForm = new FormControl();

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private subscription: Subscription;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		this.subscription = this.searchForm.valueChanges
			.pipe(debounceTime(200))
			.pipe(distinctUntilChanged())
			.subscribe((data) => {
				// console.log('value changed?', data);
				this.onSearchStringChange();
			});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.subscription?.unsubscribe();
	}

	onSearchStringChange() {
		this.stateUpdater.next(new DuelsTreasureSearchEvent(this.searchString));
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}
}
