import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { StreamsCategoryType } from '../../../models/mainwindow/streams/streams.type';
import { AdService } from '../../../services/ad.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
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
export class StreamsDesktopComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit, OnDestroy {
	menuDisplayType$: Observable<string>;
	category$: Observable<StreamsCategoryType>;
	categories$: Observable<readonly StreamsCategoryType[]>;
	showAds$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly ads: AdService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads);

		this.menuDisplayType$ = this.store
			.listen$(([main, nav]) => nav.navigationStreams.menuDisplayType)
			.pipe(this.mapData(([menuDisplayType]) => menuDisplayType));
		this.category$ = this.store
			.listen$(([main, nav]) => nav.navigationStreams.selectedCategoryId)
			.pipe(this.mapData(([selectedCategoryId]) => selectedCategoryId));
		this.categories$ = this.store
			.listen$(([main, nav]) => main.streams.categories)
			.pipe(this.mapData(([categories]) => categories ?? []));
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((info) => !info));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectCategory(categoryId: StreamsCategoryType) {
		// Do nothing, only one category
	}

	getName(categoryId: StreamsCategoryType): string {
		return this.i18n.translateString(`app.streams.category.${categoryId}`);
	}
}
