import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { LocalizationFacadeService } from '../../services/localization-facade.service';

@Component({
	standalone: false,
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
export class LotteryNavigationComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	selectedModule$: Observable<string>;
	tabs: LotteryTab[];

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

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
		this.selectedModule$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.lotteryCurrentModule || 'lottery'),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
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
