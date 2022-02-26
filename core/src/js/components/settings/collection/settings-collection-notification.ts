import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-collection-notification',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/collection/settings-collection-notification.component.scss`,
	],
	template: `
		<div class="collection-notification">
			<section class="settings-group toggle-label">
				<h2 class="modes" [owTranslate]="'settings.collection.general.title'"></h2>
				<preference-toggle
					field="collectionUseHighResImages"
					[label]="'settings.collection.general.high-resolution-images-label' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="collectionEnableNotifications"
					[label]="'settings.collection.general.notifications-label' | owTranslate"
				></preference-toggle>
				<!-- <preference-toggle
					field="collectionUseAnimatedCardBacks"
					label="Animated card backs"
					tooltip="Show animated card backs instead of static images. The animation will play when mousing over the card back only to reduce resource usage."
				></preference-toggle> -->
				<div
					class="text card-size-label"
					[owTranslate]="'settings.collection.general.card-size-in-collection-label'"
				></div>
				<preference-slider
					class="first-slider"
					[field]="'collectionCardScale'"
					[enabled]="true"
					[min]="75"
					[max]="150"
					[snapSensitivity]="5"
					[knobs]="cardSizeKnobs"
					[hackRightOffset]="8"
				>
				</preference-slider>
			</section>
			<!-- For now we group them all together to avoid needless clutter of the tabs -->
			<section class="settings-group toggle-label" [ngClass]="{ 'disabled': !(enableNotifications$ | async) }">
				<h2 class="modes" [owTranslate]="'settings.collection.general.selective-notifications-label'"></h2>
				<preference-toggle
					field="showDust"
					[label]="'settings.collection.general.notifications-dust-recap-label' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="showCommon"
					[label]="'settings.collection.general.notifications-non-golden-commons-label' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="showCardsOutsideOfPacks"
					label="Rewards"
					[label]="'settings.collection.general.notifications-rewards-label' | owTranslate"
					[tooltip]="'settings.collection.general.notifications-rewards-tooltip' | owTranslate"
				></preference-toggle>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCollectionNotificationComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	enableNotifications$: Observable<boolean>;

	cardSizeKnobs: readonly Knob[] = [
		{
			absoluteValue: 75,
			label: this.i18n.translateString('settings.global.knob-sizes.small'),
		},
		{
			absoluteValue: 100,
			label: this.i18n.translateString('settings.global.knob-sizes.medium'),
		},
		{
			absoluteValue: 150,
			label: this.i18n.translateString('settings.global.knob-sizes.large'),
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
		this.enableNotifications$ = this.listenForBasicPref$((prefs) => prefs.collectionEnableNotifications);
	}
}
