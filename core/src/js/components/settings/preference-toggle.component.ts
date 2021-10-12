import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { uuid } from '../../services/utils';

@Component({
	selector: 'preference-toggle',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/global/toggle.scss`,
		`../../../css/component/settings/settings-common.component.scss`,
		`../../../css/component/settings/preference-toggle.component.scss`,
	],
	template: `
		<div class="preference-toggle" [ngClass]="{ 'toggled-on': value }">
			<input
				hidden
				type="checkbox"
				[checked]="value"
				name=""
				id="a-01-{{ uniqueId }}-{{ field }}"
				(change)="toggleValue()"
			/>
			<label class="toggle" for="a-01-{{ uniqueId }}-{{ field }}" [ngClass]="{ 'enabled': value }">
				<p class="settings-p">
					{{ label }}
					<i class="info" *ngIf="tooltip">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#info" />
						</svg>
						<div class="zth-tooltip right">
							<p>{{ tooltip }}</p>
							<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
								<polygon points="0,0 8,-9 16,0" />
							</svg>
						</div>
					</i>
				</p>
				<b></b>
			</label>
			<div class="info-message" *ngIf="messageWhenToggleValue && shouldDisplayMessage()">
				<svg class="attention-icon">
					<use xlink:href="assets/svg/sprite.svg#attention" />
				</svg>
				{{ messageWhenToggleValue }}
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferenceToggleComponent implements AfterViewInit, OnDestroy {
	@Input() field: string;
	@Input() label: string;
	@Input() tooltip: string;
	@Input() messageWhenToggleValue: string;
	@Input() valueToDisplayMessageOn: string | boolean | number;
	@Input() toggleFunction: (newValue: boolean) => void;
	@Input() callbackOnLoad: (newValue: boolean) => void;

	value: boolean;
	toggled = false;
	uniqueId: string;

	private preferencesSubscription: Subscription;

	constructor(private prefs: PreferencesService, private cdr: ChangeDetectorRef, private ow: OverwolfService) {
		this.loadDefaultValues();
		this.uniqueId = uuid();
	}

	ngAfterViewInit() {
		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe((event) => {
			if (!event?.preferences) {
				return;
			}

			if (this.value === event.preferences[this.field]) {
				return;
			}

			this.value = event.preferences[this.field];
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.preferencesSubscription?.unsubscribe();
	}

	async toggleValue() {
		// this.value = !this.value;
		this.toggled = true;
		await this.prefs.setValue(this.field, !this.value);
		if (this.toggleFunction) {
			this.toggleFunction(this.value);
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	shouldDisplayMessage(): boolean {
		return (
			this.valueToDisplayMessageOn === this.value || (this.toggled && this.valueToDisplayMessageOn === 'onToggle')
		);
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.value = prefs[this.field];
		this.toggled = false;
		if (this.callbackOnLoad) {
			this.callbackOnLoad(this.value);
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
