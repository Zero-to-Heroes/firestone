import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { PreferencesService } from '../../services/preferences.service';

@Component({
	selector: 'preference-slider',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/settings/settings-common.component.scss`,
		`../../../css/component/settings/preference-slider.component.scss`,
	],
	template: `
		<div class="preference-slider" [ngClass]="{ 'disabled': !enabled }">
			<input
				[disabled]="!enabled"
				type="range"
				name="{{ field }}-slider"
				class="slider"
				[min]="min"
				[max]="max"
				step="any"
				(mousedown)="onSliderMouseDown($event)"
				(mouseup)="onSliderMouseUp($event)"
				[(ngModel)]="value"
				(ngModelChange)="onValueChange($event)"
			/>
			<div class="progress" [style.left.px]="left" [style.right.px]="right">
				<div class="currentValue" *ngIf="showCurrentValue">{{ displayedValue }}</div>
			</div>
			<div class="knobs" *ngIf="knobs">
				<div *ngFor="let knob of knobs" class="knob {{ knob.label }}" [style.left.%]="getKnobRealValue(knob)">
					<div class="circle"></div>
					<div class="label" *ngIf="knob.label">{{ knob.label }}</div>
				</div>
			</div>
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
	@Input() snapSensitivity = 3;
	@Input() knobs: readonly Knob[];
	@Input() showCurrentValue: boolean;
	@Input() displayedValueUnit = '%';
	@Input() hackRightOffset = 6;
	@Input() hackLeftOffset = 6;

	value: number;
	progress: number;
	left = 0;
	right = 0;
	displayedValue: string;
	valueChanged: Subject<number> = new Subject<number>();

	private subscription: Subscription;

	constructor(private prefs: PreferencesService, private cdr: ChangeDetectorRef, private el: ElementRef) {
		this.loadDefaultValues();
		this.subscription = this.valueChanged
			.pipe(
				distinctUntilChanged(),
				map((model) => {
					this.value = model;
					this.updateValueElements();
					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr.detectChanges();
					}
				}),
				debounceTime(20),
				map((model) => {
					// console.log('changing slider value', this.value, this.progress);
					this.prefs.setValue(this.field, this.value);
				}),
			)
			.subscribe();
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.subscription?.unsubscribe();
	}

	onValueChange(newValue: number): void {
		this.valueChanged.next(newValue);
	}

	// Prevent drag & drop while dragging the slider
	onSliderMouseDown(event: MouseEvent) {
		event.stopPropagation();
	}

	onSliderMouseUp(event: MouseEvent) {
		this.snapValue();
	}

	getKnobRealValue(knob: Knob) {
		const valueInPercent = knob.absoluteValue
			? (100 * (knob.absoluteValue - this.min)) / (this.max - this.min)
			: knob.percentageValue;
		// console.log('knob percent', valueInPercent);
		return Math.min(98, Math.max(0.5, valueInPercent));
	}

	private snapValue() {
		// Add snapping
		if (this.knobs) {
			for (const knob of this.knobs) {
				const snapTestValue = knob.absoluteValue
					? this.value - knob.absoluteValue
					: this.progress - knob.percentageValue;
				if (Math.abs(snapTestValue) < this.snapSensitivity) {
					// console.log('snapping', this.value, this.progress, knob, this.snapSensitivity);
					// this.progress = knob.percentageValue;
					const valueInPercent = knob.absoluteValue
						? (100 * (knob.absoluteValue - this.min)) / (this.max - this.min)
						: knob.percentageValue;
					this.value = (valueInPercent * (this.max - this.min)) / 100 + this.min;
					this.updateValueElements();
					// console.log('to', this.value, this.progress);
					this.prefs.setValue(this.field, this.value);
					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr.detectChanges();
					}
				}
			}
		}
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.value = prefs[this.field];
		this.updateValueElements();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateValueElements() {
		this.progress = ((this.value - this.min) / (this.max - this.min)) * 100;
		console.log('updating progress', this.progress, this.value, this.min, this.max);
		this.displayedValue = this.value.toFixed(0) + this.displayedValueUnit;
		const width = this.el.nativeElement.querySelector('input').getBoundingClientRect().width - 8;
		// console.log('updating left', width, this.el.nativeElement.getBoundingClientRect(), this.progress);
		this.left =
			this.knobs && this.knobs.some((knob) => knob.percentageValue === 0)
				? Math.min(10, Math.max(2, (this.progress / 100) * width))
				: 0;
		this.right = ((100 - this.progress) * width) / 100 + this.hackRightOffset;
	}
}

export interface Knob {
	readonly absoluteValue?: number;
	readonly percentageValue?: number;
	readonly label?: string;
}
