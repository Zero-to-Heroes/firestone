import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { CurrentView } from '../../models/mainwindow/achievement/current-view.type';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

@Component({
	selector: 'achievements',
	styleUrls: [
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/achievements/achievements.component.scss`,
	],
	template: `
		<div class="app-section achievements">
			<section
				class="main"
				*ngIf="currentView$ | async as currentView"
				[ngClass]="{ divider: currentView === 'list' }"
			>
				<div class="content main-content">
					<global-header></global-header>
					<achievements-categories *ngIf="currentView === 'categories'"> </achievements-categories>
					<achievements-list *ngIf="currentView === 'list'"> </achievements-list>
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
export class AchievementsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	currentView$: Observable<CurrentView>;
	showAds$: Observable<boolean>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.currentView$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationAchievements.currentView)
			.pipe(this.mapData(([currentView]) => currentView));
		this.showAds$ = this.store.showAds$().pipe(this.mapData((info) => info));
	}
}
