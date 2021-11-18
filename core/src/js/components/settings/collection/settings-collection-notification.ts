import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
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
				<h2 class="modes">General options</h2>
				<preference-toggle field="collectionUseHighResImages" label="High res images"></preference-toggle>
				<preference-toggle
					field="collectionEnableNotifications"
					label="Enable notifications"
				></preference-toggle>
				<!-- <preference-toggle
					field="collectionUseAnimatedCardBacks"
					label="Animated card backs"
					tooltip="Show animated card backs instead of static images. The animation will play when mousing over the card back only to reduce resource usage."
				></preference-toggle> -->
				<div class="text card-size-label">Card size in collection</div>
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
				<h2 class="modes">You can selectively show some card notifications</h2>
				<preference-toggle field="showDust" label="Dust recap"></preference-toggle>
				<preference-toggle field="showCommon" label="Non-golden commons"></preference-toggle>
				<preference-toggle
					field="showCardsOutsideOfPacks"
					label="Rewards"
					tooltip="Display a notification whenever you get a card outside of a pack, typically end-of-season or Arena rewards"
				></preference-toggle>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCollectionNotificationComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	enableNotifications$: Observable<boolean>;

	cardSizeKnobs: readonly Knob[] = [
		{
			absoluteValue: 75,
			label: 'Small',
		},
		{
			absoluteValue: 100,
			label: 'Default',
		},
		{
			absoluteValue: 150,
			label: 'Large',
		},
	];

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterViewInit() {
		this.enableNotifications$ = this.listenForBasicPref$((prefs) => prefs.collectionEnableNotifications);
	}
}
