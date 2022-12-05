import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'settings-achievements-notifications',
	styleUrls: [
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/achievements/settings-achievements-notifications.component.scss`,
	],
	template: `
		<div
			class="settings-group achievements-notifications"
			*ngIf="{
				achievementsEnabled: achievementsEnabled$ | async
			} as value"
		>
			<preference-toggle
				field="achievementsFullEnabled"
				[label]="'settings.achievements.notifications.achievements-enabled-text' | owTranslate"
				[tooltip]="'settings.achievements.notifications.achievements-enabled-tooltip' | owTranslate"
			></preference-toggle>
			<preference-toggle
				field="achievementsEnabled2"
				[label]="'settings.achievements.notifications.firestone-achievements-text' | owTranslate"
				[tooltip]="'settings.achievements.notifications.firestone-achievements-tooltip' | owTranslate"
				[ngClass]="{ disabled: !value.achievementsEnabled }"
			></preference-toggle>
			<preference-toggle
				field="achievementsDisplayNotifications2"
				[label]="'settings.achievements.notifications.show-notifications-text' | owTranslate"
				[tooltip]="'settings.achievements.notifications.show-notifications-tooltip' | owTranslate"
				[ngClass]="{ disabled: !value.achievementsEnabled }"
			></preference-toggle>
			<preference-toggle
				*ngIf="isDev"
				field="resetAchievementsOnAppStart"
				[label]="'settings.achievements.notifications.streamer-mode-text' | owTranslate"
				[tooltip]="'settings.achievements.notifications.streamer-mode-tooltip' | owTranslate"
				advancedSetting
				[messageWhenToggleValue]="
					'settings.achievements.notifications.streamer-mode-confirmation' | owTranslate
				"
				[valueToDisplayMessageOn]="true"
				[ngClass]="{ disabled: !value.achievementsEnabled }"
			></preference-toggle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAchievementsNotificationsComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	achievementsEnabled$: Observable<boolean>;

	isDev: boolean;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
		this.isDev = process.env.NODE_ENV !== 'production';
	}

	ngAfterContentInit() {
		this.achievementsEnabled$ = this.listenForBasicPref$((prefs) => prefs.achievementsFullEnabled);
	}
}
