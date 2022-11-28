import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { IOption } from 'ng-select';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'settings-decktracker-duels',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-decktracker-duels.component.scss`,
	],
	template: `
		<div class="decktracker-appearance" scrollable>
			<div class="subtitle" [owTranslate]="'settings.decktracker.duels.title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="duelsShowOocTracker"
					[label]="'settings.decktracker.duels.show-ooc-tracker-label' | owTranslate"
					[tooltip]="'settings.decktracker.duels.show-ooc-tracker-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="duelsShowInfoOnHeroSelection"
					[label]="'settings.decktracker.duels.show-ooc-hero-info-label' | owTranslate"
					[tooltip]="'settings.decktracker.duels.show-ooc-hero-info-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="duelsShowOocDeckSelect"
					[label]="'settings.decktracker.duels.show-ooc-deck-select-label' | owTranslate"
					[tooltip]="'settings.decktracker.duels.show-ooc-deck-select-tooltip' | owTranslate"
				></preference-toggle>
				<preferences-dropdown
					field="duelsShowMaxLifeWidget2"
					[label]="'settings.decktracker.duels.max-health-label' | owTranslate"
					[tooltip]="'settings.decktracker.duels.max-health-tooltip' | owTranslate"
					[options]="maxHealthOptions"
				></preferences-dropdown>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDecktrackerDuelsComponent extends AbstractSubscriptionComponent {
	maxHealthOptions: IOption[] = ['off', 'mouseover', 'blink'].map((value) => ({
		value: value,
		label: this.i18n.translateString(`settings.decktracker.duels.max-health-option-${value}`) ?? '',
	}));

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}
}
