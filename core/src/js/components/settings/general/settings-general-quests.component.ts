import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'settings-general-quests',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/general/settings-general-quests.component.scss`,
	],
	template: `
		<div
			class="general-quests"
			*ngIf="{
				enableQuests: enableQuests$ | async,
				hsShowQuestsWidget: hsShowQuestsWidget$ | async
			} as value"
		>
			<div class="title" [owTranslate]="'settings.general.quests.title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="enableQuestsWidget"
					[label]="'settings.general.quests.enable-quests-label' | owTranslate"
					[tooltip]="'settings.general.quests.enable-quests-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="showQuestsWidgetWhenEmpty"
					[ngClass]="{ 'disabled': !value.enableQuests }"
					[label]="'settings.general.quests.show-when-empty-label' | owTranslate"
					[tooltip]="'settings.general.quests.show-when-empty-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="showQuestsInGame"
					[ngClass]="{ 'disabled': !value.enableQuests }"
					[label]="'settings.general.quests.show-in-game-label' | owTranslate"
					[tooltip]="'settings.general.quests.show-in-game-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="hsShowQuestsWidget" 
					[ngClass]="{ 'disabled': !value.enableQuests }"
					[label]="'settings.general.quests.constructed-label' | owTranslate"
					[tooltip]="'settings.general.quests.constructed-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="hsShowQuestsWidgetOnHub"
					[ngClass]="{ 'disabled': !value.enableQuests || !value.hsShowQuestsWidget }"
					[label]="'settings.general.quests.constructed-on-hub-label' | owTranslate"
					[tooltip]="'settings.general.quests.constructed-on-hub-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="hsShowQuestsWidgetOnBg"
					[ngClass]="{ 'disabled': !value.enableQuests || !value.hsShowQuestsWidget }"
					[label]="'settings.general.quests.constructed-on-bg-label' | owTranslate"
					[tooltip]="'settings.general.quests.constructed-on-bg-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsShowQuestsWidget"
					[ngClass]="{ 'disabled': !value.enableQuests }"
					[label]="'settings.general.quests.battlegrounds-label' | owTranslate"
					[tooltip]="'settings.general.quests.battlegrounds-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="mercsShowQuestsWidget"
					[ngClass]="{ 'disabled': !value.enableQuests }"
					[label]="'settings.general.quests.mercenaries-label' | owTranslate"
					[tooltip]="'settings.general.quests.mercenaries-tooltip' | owTranslate"
				></preference-toggle>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralQuestsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	enableQuests$: Observable<boolean>;
	hsShowQuestsWidget$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.enableQuests$ = this.listenForBasicPref$((prefs) => prefs.enableQuestsWidget);
		this.hsShowQuestsWidget$ = this.listenForBasicPref$((prefs) => prefs.hsShowQuestsWidget);
	}
}
