import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AchievementsNavigationService } from '@firestone/achievements/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { CurrentView } from '../../models/mainwindow/achievement/current-view.type';
import { AdService } from '../../services/ad.service';

@Component({
	standalone: false,
	selector: 'achievements',
	styleUrls: [
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/achievements/achievements.component.scss`,
	],
	template: `
		<div class="app-section achievements">
			<section
				class="main"
				*ngIf="{ currentView: currentView$ | async, menuDisplayType: menuDisplayType$ | async } as value"
				[ngClass]="{ divider: value.currentView === 'list' }"
			>
				<div class="content main-content">
					<global-header [backArrow]="value.menuDisplayType === 'breadcrumbs'"></global-header>
					<achievements-categories *ngIf="value.currentView === 'categories'"> </achievements-categories>
					<achievements-list *ngIf="value.currentView === 'list'"> </achievements-list>
				</div>
			</section>
			<section class="secondary" *ngIf="!(showAds$ | async)">
				<achievements-filter></achievements-filter>
				<achievement-history></achievement-history>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	currentView$: Observable<CurrentView>;
	menuDisplayType$: Observable<string>;
	showAds$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: AchievementsNavigationService,
		private readonly ads: AdService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads, this.nav);

		this.currentView$ = this.nav.currentView$$.pipe(this.mapData((currentView) => currentView));
		this.menuDisplayType$ = this.nav.menuDisplayType$$.pipe(this.mapData((currentView) => currentView));
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((info) => !info));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
