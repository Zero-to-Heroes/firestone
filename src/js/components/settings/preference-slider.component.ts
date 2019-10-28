import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, ViewRef } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { PreferencesService } from '../../services/preferences.service';

@Component({
	selector: 'preference-slider',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/settings/settings-common.component.scss`,
		`../../../css/component/settings/preference-slider.component.scss`,
	],
	template: `
		<div class="preference-slider">
			<label for="{{ field }}-slider" [ngClass]="{ 'disabled': !enabled }">
				<span>{{ label }}</span>
				<i class="info" *ngIf="tooltip || tooltipDisabled">
					<svg>
						<use xlink:href="/Files/assets/svg/sprite.svg#info" />
					</svg>
					<div class="zth-tooltip right">
						<p>
							{{ !enabled && tooltipDisabled ? tooltipDisabled : tooltip }}
						</p>
						<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
							<polygon points="0,0 8,-9 16,0" />
						</svg>
					</div>
				</i>
			</label>
			<input
				[disabled]="!enabled"
				type="range"
				name="{{ field }}-slider"
				class="slider"
				[min]="min"
				[max]="max"
				(mousedown)="onSliderMouseDown($event)"
				[(ngModel)]="value"
				(ngModelChange)="onValueChange($event)"
			/>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferenceSliderComponent implements OnDestroy {
	@Input() field: string;
	@Input() label: string;
	@Input() enabled: boolean;
	@Input() tooltip: string;
	@Input() tooltipDisabled: string;
	@Input() min: number;
	@Input() max: number;

	value: number;
	valueChanged: Subject<number> = new Subject<number>();

	private subscription: Subscription;

	constructor(private prefs: PreferencesService, private cdr: ChangeDetectorRef) {
		this.loadDefaultValues();
		this.subscription = this.valueChanged
			.pipe(
				// debounceTime(20),
				distinctUntilChanged(),
			)
			.subscribe(model => {
				this.value = model;
				// console.log('changing scale value', this.value);
				this.prefs.setValue(this.field, this.value);
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			});
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	onValueChange(newValue: number): void {
		this.valueChanged.next(newValue);
	}

	// Prevent drag & drop while dragging the slider
	onSliderMouseDown(event: MouseEvent) {
		event.stopPropagation();
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.value = prefs[this.field];
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
