/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @angular-eslint/template/eqeqeq */
/* eslint-disable @angular-eslint/template/no-negated-async */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	IAdsService,
	ILocalizationService,
	UserService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { Observable, from } from 'rxjs';
import { ComunitiesCategory } from '../models/navigation';
import { CommunityNavigationService } from '../services/community-navigation.service';

@Component({
	selector: 'communities-desktop',
	styleUrls: [
		`../../../../../shared/styles/src/lib/styles/app-section.component.scss`,
		`./communities-desktop.component.scss`,
	],
	template: `
		<div
			class="app-section communities"
			*ngIf="{ category: category$ | async, isLoggedIn: isLoggedIn$ | async } as value"
		>
			<section class="main">
				<with-loading [isLoading]="loading$ | async">
					<div class="main-container">
						<nav class="menu-selection">
							<li
								*ngFor="let cat of categories$ | async"
								[ngClass]="{ selected: isSelected(cat, value.category) }"
								(mousedown)="selectCategory(cat.id)"
							>
								{{ cat.name }}
							</li>
						</nav>
						<ng-container *ngIf="value.isLoggedIn">
							<communities-join
								class="content-section"
								*ngIf="value.category === 'manage'"
							></communities-join>
							<my-communities
								class="content-section"
								*ngIf="value.category === 'my-communities'"
							></my-communities>
							<community-details
								class="content-section"
								*ngIf="value.category === 'community-details'"
							></community-details>
						</ng-container>
						<ng-container *ngIf="!value.isLoggedIn" [fsTranslate]="'app.communities.please-log-in'">
						</ng-container>
					</div>
				</with-loading>
			</section>
			<section
				class="secondary divider"
				*ngIf="(showAds$ | async) === false && showSidebar(value.category)"
			></section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunitiesDesktopComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	categories$: Observable<readonly Category[]>;
	category$: Observable<ComunitiesCategory | null>;
	selectedCategoryId$: Observable<string | null>;
	showAds$: Observable<boolean>;
	isLoggedIn$: Observable<boolean>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly nav: CommunityNavigationService,
		private readonly user: UserService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads, this.nav, this.user);

		this.loading$ = from([false]);
		this.showAds$ = this.ads.showAds$$.pipe(this.mapData((info) => info));
		this.category$ = this.nav.category$$.pipe(this.mapData((info) => info));
		this.selectedCategoryId$ = this.nav.selectedCommunity$$.pipe(this.mapData((info) => info));
		this.categories$ = from([
			[
				{ id: 'manage' as ComunitiesCategory, name: this.i18n.translateString('app.communities.menu.manage')! },
				{
					id: 'my-communities' as ComunitiesCategory,
					name: this.i18n.translateString('app.communities.menu.my-communities')!,
				},
			],
		]);
		this.isLoggedIn$ = this.user.user$$.pipe(this.mapData((user) => !!user?.username));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	isSelected(cat: Category, selected: ComunitiesCategory | null) {
		switch (selected) {
			case 'community-details':
				return cat.id === 'my-communities';
		}
		return cat.id === selected;
	}

	showSidebar(value: any) {
		return false;
	}

	selectCategory(id: ComunitiesCategory) {
		this.nav.changeCategory(id);
	}
}

interface Category {
	id: ComunitiesCategory;
	name: string;
}
