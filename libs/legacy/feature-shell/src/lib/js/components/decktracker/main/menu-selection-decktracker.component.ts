import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { AnalyticsService, OverwolfService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { DecktrackerViewType } from '../../../models/mainwindow/decktracker/decktracker-view.type';
import { SelectDecksViewEvent } from '../../../services/mainwindow/store/events/decktracker/select-decks-view-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'menu-selection-decktracker',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/menu-selection-decktracker.component.scss`,
	],
	template: `
		<nav class="menu-selection" *ngIf="selectedTab$ | async as selectedTab">
			<button
				*ngFor="let menuItem of menuItems"
				class="menu-item"
				tabindex="0"
				[ngClass]="{
					selected: selectedTab === menuItem.id || menuItem.subMenus?.includes(selectedTab),
					disabled: menuItem.comingSoon
				}"
				premiumSetting
				[premiumSettingEnabled]="menuItem.isPremium"
			>
				<div class="premium-lock" [helpTooltip]="'settings.global.locked-tooltip' | owTranslate">
					<svg>
						<use xlink:href="assets/svg/sprite.svg#lock" />
					</svg>
				</div>
				<span class="text" [owTranslate]="menuItem.translationKey" (mousedown)="selectStage(menuItem)"></span>
				<span
					class="coming-soon"
					*ngIf="menuItem.comingSoon"
					[owTranslate]="'app.collection.sets.coming-soon'"
				></span>
			</button>
		</nav>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSelectionDecktrackerComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	selectedTab$: Observable<DecktrackerViewType>;

	menuItems: readonly MenuItem[] = [
		{
			id: 'decks',
			translationKey: 'app.decktracker.menu.decks-header',
		},
		{
			id: 'constructed-meta-decks',
			translationKey: 'app.decktracker.menu.meta-decks-header',
			subMenus: ['constructed-meta-deck-details'],
		},
		{
			id: 'constructed-meta-archetypes',
			translationKey: 'app.decktracker.menu.meta-archetypes-header',
			isPremium: true,
			// comingSoon: true,
		},
		{
			id: 'ladder-stats',
			translationKey: 'app.decktracker.menu.stats-header',
		},
		{
			id: 'ladder-ranking',
			translationKey: 'app.decktracker.menu.ranking-header',
		},
		{
			id: 'constructed-deckbuilder',
			translationKey: 'app.decktracker.menu.deckbuilder-header',
		},
	];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.selectedTab$ = this.store
			.listen$(([main, nav]) => nav.navigationDecktracker.currentView)
			.pipe(this.mapData(([tab]) => tab));
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectStage(item: MenuItem) {
		if (item.comingSoon) {
			return;
		}
		this.analytics.trackEvent(`navigation-decktracker`, { tab: item.id });
		this.stateUpdater.next(new SelectDecksViewEvent(item.id));
	}
}

interface MenuItem {
	readonly id: DecktrackerViewType;
	readonly translationKey: string;
	readonly subMenus?: readonly DecktrackerViewType[];
	readonly isPremium?: boolean;
	readonly comingSoon?: boolean;
}
