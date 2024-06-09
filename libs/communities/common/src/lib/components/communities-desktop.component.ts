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
import { ADS_SERVICE_TOKEN, IAdsService, waitForReady } from '@firestone/shared/framework/core';
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
		<div class="app-section communities" *ngIf="{ category: category$ | async } as value">
			<section class="main divider">
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
					</div>
				</with-loading>
			</section>
			<section class="secondary" *ngIf="(showAds$ | async) === false && showSidebar(value.category)"></section>
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

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly nav: CommunityNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads, this.nav);

		this.loading$ = from([false]);
		this.showAds$ = this.ads.showAds$$.pipe(this.mapData((info) => info));
		this.category$ = this.nav.category$$.pipe(this.mapData((info) => info));
		this.selectedCategoryId$ = this.nav.selectedCommunity$$.pipe(this.mapData((info) => info));
		this.categories$ = from([
			[
				{ id: 'manage' as ComunitiesCategory, name: 'Manage' },
				{ id: 'my-communities' as ComunitiesCategory, name: 'My communities' },
			],
		]);

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
		console.log('selecting category', id);
		this.nav.category$$.next(id);
	}
}

interface Category {
	id: ComunitiesCategory;
	name: string;
}
