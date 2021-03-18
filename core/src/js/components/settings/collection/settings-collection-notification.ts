import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
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
				<preference-toggle
					field="collectionUseAnimatedCardBacks"
					label="Animated card backs"
					tooltip="Show animated card backs instead of static images. The animation will play when mousing over the card back only to reduce resource usage."
				></preference-toggle>
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
			<section class="settings-group toggle-label" [ngClass]="{ 'disabled': !enableNotifications }">
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
export class SettingsCollectionNotificationComponent implements AfterViewInit {
	enableNotifications: boolean;
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

	private preferencesSubscription: Subscription;

	constructor(private prefs: PreferencesService, private cdr: ChangeDetectorRef, private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.loadDefaultValues();
		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.asObservable().subscribe(event => {
			const preferences: Preferences = event.preferences;
			this.enableNotifications = preferences.collectionEnableNotifications;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.preferencesSubscription?.unsubscribe();
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.enableNotifications = prefs.collectionEnableNotifications;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
