import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ConstructedStatsTab } from '../../../models/mainwindow/decktracker/decktracker-view.type';
import { GenericPreferencesUpdateEvent } from '../../../services/mainwindow/store/events/generic-preferences-update-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'decktracker-ladder-stats',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-ladder-stats.component.scss`,
	],
	template: `
		<div class="decktracker-ladder-stats" *ngIf="selectedTab$ | async as selectedTab">
			<nav class="menu-selection">
				<button
					[attr.tabindex]="0"
					type="button"
					class="menu-item overview"
					[attr.aria-label]="'app.decktracker.ladder-stats.tab-selection.overview' | owTranslate"
					[helpTooltip]="'app.decktracker.ladder-stats.tab-selection.overview' | owTranslate"
					inlineSVG="assets/svg/created_by.svg"
					[ngClass]="{ 'selected': selectedTab === 'overview' }"
					(click)="selectTab('overview')"
				></button>
				<button
					[attr.tabindex]="0"
					type="button"
					class="menu-item matchups"
					[attr.aria-label]="'app.decktracker.ladder-stats.tab-selection.matchups' | owTranslate"
					[helpTooltip]="'app.decktracker.ladder-stats.tab-selection.matchups' | owTranslate"
					inlineSVG="assets/svg/sword.svg"
					[ngClass]="{ 'selected': selectedTab === 'matchups' }"
					(click)="selectTab('matchups')"
				></button>
			</nav>
			<ng-container [ngSwitch]="selectedTab">
				<decktracker-ladder-stats-overview *ngSwitchCase="'overview'"></decktracker-ladder-stats-overview>
				<decktracker-ladder-stats-matchups *ngSwitchCase="'matchups'"></decktracker-ladder-stats-matchups>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerLadderStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	selectedTab$: Observable<ConstructedStatsTab>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.selectedTab$ = this.listenForBasicPref$((prefs) => prefs.constructedStatsTab);
	}

	selectTab(tab: ConstructedStatsTab) {
		this.store.send(new GenericPreferencesUpdateEvent((prefs) => ({ ...prefs, constructedStatsTab: tab })));
	}
}
