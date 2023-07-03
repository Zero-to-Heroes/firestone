import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { AnalyticsService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { Preferences } from '../../models/preferences';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';

@Component({
	selector: 'lottery-navigation',
	styleUrls: ['../../../css/component/lottery/lottery-navigation.component.scss'],
	template: `
		<div class="navigation" *ngIf="selectedModule$ | async as selectedModule">
			<button
				*ngFor="let tab of tabs"
				type="button"
				class="menu-item"
				[ngClass]="{ selected: selectedModule === tab.id }"
				(click)="selectModule(tab.id)"
				[helpTooltip]="tab.tooltip"
				[helpTooltipClasses]="'general-theme'"
			>
				<div class="icon" [inlineSVG]="tab.icon"></div>
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotteryNavigationComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	selectedModule$: Observable<string>;
	tabs: LotteryTab[];

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationFacadeService,
		private readonly analytics: AnalyticsService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.tabs = [
			{
				id: 'lottery',
				icon: 'assets/svg/lottery.svg',
				tooltip: this.i18n.translateString('app.lottery.navigation.lottery'),
			},
			{
				id: 'achievements',
				icon: 'assets/svg/whatsnew/achievements.svg',
				tooltip: this.i18n.translateString('app.lottery.navigation.achievements'),
			},
		];
		this.selectedModule$ = this.store
			.listenPrefs$((prefs) => prefs.lotteryCurrentModule)
			.pipe(this.mapData(([module]) => module || 'lottery'));
	}

	async selectModule(module: LotteryTabType) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = { ...prefs, lotteryCurrentModule: module };
		this.prefs.savePreferences(newPrefs);
	}
}

interface LotteryTab {
	readonly id: LotteryTabType;
	readonly icon: string;
	readonly tooltip: string;
}

export type LotteryTabType = 'lottery' | 'achievements';
