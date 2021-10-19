import { AfterViewInit, ChangeDetectionStrategy, Component, HostListener, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { MercenariesHeroSearchEvent } from '../../../../services/mainwindow/store/events/mercenaries/mercenaries-hero-search-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';

@Component({
	selector: 'mercenaries-hero-search',
	styleUrls: [`../../../../../css/component/mercenaries/desktop/secondary/mercenaries-hero-search.component.scss`],
	template: `
		<div class="mercenaries-hero-search">
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
					placeholder="Search hero..."
				/>
			</label>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesHeroSearchComponent implements AfterViewInit, OnDestroy {
	searchString: string;
	searchForm = new FormControl();

	private searchFormSub$$: Subscription;
	private searchStringSub$$: Subscription;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreFacadeService) {
		this.searchStringSub$$ = this.store
			.listen$(([main, nav]) => nav.navigationMercenaries.heroSearchString)
			.pipe(tap((stat) => cdLog('emitting in ', this.constructor.name, stat)))
			.subscribe(([heroSearchString]) => {
				// TODO: force change detectiopn here?
				this.searchString = heroSearchString;
			});
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
	ngOnDestroy() {
		this.searchFormSub$$?.unsubscribe();
		this.searchStringSub$$?.unsubscribe();
	}

	onSearchStringChange() {
		this.store.send(new MercenariesHeroSearchEvent(this.searchString));
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}
}
