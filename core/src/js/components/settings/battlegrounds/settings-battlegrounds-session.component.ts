import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-battlegrounds-session',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/battlegrounds/settings-battlegrounds-general.component.scss`,
	],
	template: `
		<div
			class="battlegrounds-general"
			*ngIf="{
				showCurrentSessionWidgetBgs: showCurrentSessionWidgetBgs$ | async
			} as value"
			scrollable
		>
			<div class="title" [owTranslate]="'settings.battlegrounds.session-widget-title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="showCurrentSessionWidgetBgs"
					[label]="'settings.battlegrounds.session-widget-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.session-widget-label-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="sessionWidgetShowGroup"
					[ngClass]="{ 'disabled': !value.showCurrentSessionWidgetBgs }"
					[label]="'settings.battlegrounds.session-widget-show-groups' | owTranslate"
					[tooltip]="'settings.battlegrounds.session-widget-show-groups-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="sessionWidgetShowMatches"
					[ngClass]="{ 'disabled': !value.showCurrentSessionWidgetBgs }"
					[label]="'settings.battlegrounds.session-widget-show-matches' | owTranslate"
					[tooltip]="'settings.battlegrounds.session-widget-show-matches-tooltip' | owTranslate"
				></preference-toggle>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBattlegroundsSessionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showCurrentSessionWidgetBgs$: Observable<boolean>;

	numberOfSimsKnobs: readonly Knob[] = [
		{
			absoluteValue: 2500,
		},
	];
	sizeKnobs: readonly Knob[] = [
		{
			percentageValue: 0,
			label: 'Small',
		},
		{
			percentageValue: 18,
			label: 'Medium',
		},
		{
			percentageValue: 100,
			label: 'Large',
		},
	];

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.showCurrentSessionWidgetBgs$ = this.listenForBasicPref$((prefs) => prefs.showCurrentSessionWidgetBgs);
	}
}
