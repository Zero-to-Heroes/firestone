import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import {
	MainWindowNavigationService,
	MainWindowStateFacadeService,
	StreamsCategoryType,
} from '@firestone/mainwindow/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	standalone: false,
	selector: 'streams-desktop',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/streams/desktop/streams-desktop.component.scss`,
	],
	template: `
		<div class="app-section streams" *ngIf="{ category: category$ | async } as value">
			<section class="main divider">
				<div class="content main-content" *ngIf="{ value: menuDisplayType$ | async } as menuDisplayType">
					<global-header *ngIf="menuDisplayType.value === 'breadcrumbs'"></global-header>
					<ul class="menu-selection" *ngIf="menuDisplayType.value === 'menu'">
						<li
							*ngFor="let cat of categories$ | async"
							[ngClass]="{ selected: cat === value.category }"
							(mousedown)="selectCategory(cat)"
						>
							<span>{{ getName(cat) }}</span>
						</li>
					</ul>
					<live-streams *ngIf="value.category === 'live-streams'"></live-streams>
				</div>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamsDesktopComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	menuDisplayType$: Observable<string>;
	category$: Observable<StreamsCategoryType>;
	categories$: Observable<readonly StreamsCategoryType[]>;
	showAds$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly nav: MainWindowNavigationService,
		private readonly mainWindowState: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads, this.nav, this.mainWindowState);

		this.menuDisplayType$ = this.nav.navigationState$$.pipe(
			this.mapData((state) => state.navigationStreams.menuDisplayType),
		);
		this.category$ = this.nav.navigationState$$.pipe(
			this.mapData((state) => state.navigationStreams.selectedCategoryId),
		);
		this.categories$ = this.mainWindowState.mainWindowState$$.pipe(
			this.mapData((state) => state.streams.categories),
		);
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((info) => !info));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	selectCategory(categoryId: StreamsCategoryType) {
		// Do nothing, only one category
	}

	getName(categoryId: StreamsCategoryType): string {
		return this.i18n.translateString(`app.streams.category.${categoryId}`);
	}
}
