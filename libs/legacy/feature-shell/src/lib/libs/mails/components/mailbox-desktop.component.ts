import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { Observable } from 'rxjs';
import { MailCategoryType } from '../mail-state';

@Component({
	selector: 'mailbox-desktop',
	styleUrls: [`../../../css/component/app-section.component.scss`, `./mailbox-desktop.component.scss`],
	template: `
		<div class="app-section mailbox" *ngIf="{ category: category$ | async } as value">
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
					<mailbox *ngIf="value.category === 'inbox'"></mailbox>
				</div>
			</section>
			<section class="secondary" *ngIf="!(showAds$ | async)"></section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MailboxDesktopComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit, OnDestroy {
	menuDisplayType$: Observable<string>;
	category$: Observable<MailCategoryType>;
	categories$: Observable<readonly MailCategoryType[]>;
	showAds$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.menuDisplayType$ = this.store.mails$().pipe(this.mapData((mailState) => mailState.menuDisplayType));
		this.category$ = this.store.mails$().pipe(this.mapData((mailState) => mailState.selectedCategoryId));
		this.categories$ = this.store.mails$().pipe(this.mapData((mailState) => mailState.categories));
		this.showAds$ = this.store.showAds$().pipe(this.mapData((info) => info));
	}

	selectCategory(categoryId: MailCategoryType) {
		// Do nothing, only one category
	}

	getName(categoryId: MailCategoryType): string {
		return this.i18n.translateString(`app.mailbox.category.${categoryId}`);
	}
}
