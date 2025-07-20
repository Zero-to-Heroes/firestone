import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { BgsHeroFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-hero-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';

@Component({
	selector: 'battlegrounds-hero-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-hero-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsHeroFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	options: HeroFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private collator = new Intl.Collator('en-US');

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly nav: BattlegroundsNavigationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
		this.options = [
			{
				value: 'all',
				label: this.i18n.translateString('app.battlegrounds.filters.hero.all'),
			} as HeroFilterOption,
			...this.allCards
				.getCards()
				.filter((card) => card.battlegroundsHero)
				.map(
					(card) =>
						({
							label: card.name,
							value: card.id,
						} as HeroFilterOption),
				)
				.sort((a, b) => this.collator.compare(a.label, b.label)),
		];
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs);

		this.filter$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveHeroFilter)),
			this.nav.selectedCategoryId$$,
		]).pipe(
			filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
			this.mapData(([filter, selectedCategoryId]) => ({
				filter: filter,
				placeholder: this.options.find((option) => option.value === filter)?.label,
				visible: selectedCategoryId === 'bgs-category-perfect-games',
			})),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: HeroFilterOption) {
		this.stateUpdater.next(new BgsHeroFilterSelectedEvent(option.value));
	}
}

interface HeroFilterOption extends IOption {
	value: string;
}
