import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
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
				showCurrentSessionWidgetBgs: showCurrentSessionWidgetBgs$ | async,
				sessionWidgetShowMatches: sessionWidgetShowMatches$ | async
			} as value"
			scrollable
		>
			<div class="title" [owTranslate]="'settings.battlegrounds.session-widget.title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="showCurrentSessionWidgetBgs"
					[label]="'settings.battlegrounds.session-widget.label' | owTranslate"
					[tooltip]="'settings.battlegrounds.session-widget.label-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="sessionWidgetShowGroup"
					[ngClass]="{ 'disabled': !value.showCurrentSessionWidgetBgs }"
					[label]="'settings.battlegrounds.session-widget.show-groups' | owTranslate"
					[tooltip]="'settings.battlegrounds.session-widget.show-groups-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="hideCurrentSessionWidgetWhenFriendsListIsOpen"
					[ngClass]="{ 'disabled': !value.showCurrentSessionWidgetBgs }"
					[label]="'settings.battlegrounds.session-widget.hide-when-friends-list-open' | owTranslate"
					[tooltip]="
						'settings.battlegrounds.session-widget.hide-when-friends-list-open-tooltip' | owTranslate
					"
				></preference-toggle>
				<preference-toggle
					field="sessionWidgetShowMatches"
					[ngClass]="{ 'disabled': !value.showCurrentSessionWidgetBgs }"
					[label]="'settings.battlegrounds.session-widget.show-matches' | owTranslate"
					[tooltip]="'settings.battlegrounds.session-widget.show-matches-tooltip' | owTranslate"
				></preference-toggle>
				<preference-numeric-input
					[disabled]="!value.showCurrentSessionWidgetBgs || !value.sessionWidgetShowMatches"
					[label]="'settings.battlegrounds.session-widget.number-of-matches' | owTranslate"
					[tooltip]="'settings.battlegrounds.session-widget.number-of-matches-tooltip' | owTranslate"
					[field]="'sessionWidgetNumberOfMatchesToShow'"
				></preference-numeric-input>
			</div>

			<div class="title" [owTranslate]="'settings.battlegrounds.session-widget.size-title'"></div>
			<div class="settings-group">
				<preference-slider
					class="minions-list-size-slider"
					field="sessionWidgetScale"
					[enabled]="value.showCurrentSessionWidgetBgs"
					[showCurrentValue]="false"
					displayedValueUnit=""
					[min]="60"
					[max]="140"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
			</div>

			<div class="title" [owTranslate]="'settings.battlegrounds.session-widget.opacity-title'"></div>
			<div class="settings-group">
				<preference-slider
					class="minions-list-size-slider"
					field="sessionWidgetOpacity"
					[enabled]="value.showCurrentSessionWidgetBgs"
					[showCurrentValue]="false"
					displayedValueUnit=""
					[min]="0"
					[max]="100"
					[snapSensitivity]="5"
					[knobs]="opacityKnobs"
				>
				</preference-slider>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBattlegroundsSessionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showCurrentSessionWidgetBgs$: Observable<boolean>;
	sessionWidgetShowMatches$: Observable<boolean>;

	sizeKnobs: readonly Knob[] = [
		{
			percentageValue: 0,
			label: this.i18n.translateString('settings.global.knob-sizes.small'),
		},
		{
			percentageValue: 50,
			label: this.i18n.translateString('settings.global.knob-sizes.medium'),
		},
		{
			percentageValue: 100,
			label: this.i18n.translateString('settings.global.knob-sizes.large'),
		},
	];
	opacityKnobs: readonly Knob[] = [
		{
			percentageValue: 0,
			label: this.i18n.translateString('settings.global.knob-opacity.transparent'),
		},
		{
			percentageValue: 100,
			label: this.i18n.translateString('settings.global.knob-opacity.opaque'),
		},
	];

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.showCurrentSessionWidgetBgs$ = this.listenForBasicPref$((prefs) => prefs.showCurrentSessionWidgetBgs);
		this.sessionWidgetShowMatches$ = this.listenForBasicPref$((prefs) => prefs.sessionWidgetShowMatches);
	}
}
