import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Inject,
	ViewRef,
} from '@angular/core';
import { ConstructedNavigationService, DecktrackerViewType } from '@firestone/constructed/common';
import { MainWindowStateFacadeService, MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, AnalyticsService, IAdsService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SelectDecksViewEvent } from '@firestone/mainwindow/common';

@Component({
	standalone: false,
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
					disabled: menuItem.comingSoon,
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
export class MenuSelectionDecktrackerComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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
			subMenus: ['constructed-meta-archetype-details'],
			// isPremium: true,
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

	private premium$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
		private readonly analytics: AnalyticsService,
		private readonly nav: ConstructedNavigationService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.ads);

		this.selectedTab$ = this.nav.currentView$$.pipe(this.mapData((tab) => tab));
		this.ads.hasPremiumSub$$.pipe(this.mapData((hasPremium) => hasPremium)).subscribe((hasPremium) => {
			this.premium$$.next(hasPremium);
		});

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	selectStage(item: MenuItem) {
		if (item.comingSoon) {
			return;
		}
		if (item.isPremium && !this.premium$$.value) {
			return;
		}

		this.analytics.trackEvent(`navigation-decktracker`, { tab: item.id });
		this.mainWindowStateFacade.send(new SelectDecksViewEvent(item.id));
	}
}

interface MenuItem {
	readonly id: DecktrackerViewType;
	readonly translationKey: string;
	readonly subMenus?: readonly DecktrackerViewType[];
	readonly isPremium?: boolean;
	readonly comingSoon?: boolean;
}
