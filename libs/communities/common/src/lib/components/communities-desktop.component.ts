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
import { ADS_SERVICE_TOKEN, IAdsService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, from } from 'rxjs';

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
								[ngClass]="{ selected: cat.id === value.category }"
								(mousedown)="selectCategory(cat.id)"
							>
								{{ cat.name }}
							</li>
						</nav>
						<communities-join class="content-section" *ngIf="value.category === 'join'"></communities-join>
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
	// menuDisplayType$: Observable<string>;
	categories$: Observable<readonly Category[]>;
	category$: Observable<string>;
	showAds$: Observable<boolean>;

	private category$$ = new BehaviorSubject<string>('join');

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.ads.isReady();

		this.loading$ = from([false]);
		this.showAds$ = this.ads.showAds$$.pipe(this.mapData((info) => info));
		// TODO: if part of one community, default to My Communities
		this.category$ = this.category$$.asObservable();
		this.categories$ = from([
			[
				{ id: 'join', name: 'Join' },
				{ id: 'my-communities', name: 'My communities' },
			],
		]);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	showSidebar(value: any) {
		return false;
	}

	selectCategory(id: string) {
		console.log('selecting category', id);
		this.category$$.next(id);
	}
}

interface Category {
	id: string;
	name: string;
}
