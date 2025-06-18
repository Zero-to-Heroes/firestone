/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
	selector: 'preference-slider',
	styleUrls: [
		// `../../../css/component/settings/settings-common.component.scss`,
		`./preference-slider.component.scss`,
	],
	template: `
		<div class="preference-slider" [ngClass]="{ disabled: !enabled }" (mousedown)="onSliderMouseDown($event)">
			<input
				[disabled]="!enabled"
				type="range"
				name="{{ field }}-slider"
				class="slider"
				[min]="min"
				[max]="max"
				step="any"
				(mouseup)="onSliderMouseUp($event)"
				[(ngModel)]="value"
				(ngModelChange)="onValueChange($event)"
			/>
			<div class="progress-background"></div>
			<div class="progress" [style.left.px]="left" [style.right.px]="right"></div>
			<div class="thumb" [style.left.px]="leftThumb"></div>
			<div class="currentValue" *ngIf="showCurrentValue" [style.left.px]="leftThumb">
				{{ displayedValue }}
			</div>
			<div class="knobs" *ngIf="knobs">
				<div *ngFor="let knob of knobs" class="knob {{ knob.label }}" [style.left.px]="getKnobRealValue(knob)">
					<div class="circle"></div>
					<div class="label" *ngIf="knob.label">{{ knob.label }}</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferenceSliderComponent extends AbstractSubscriptionComponent implements OnDestroy {
	@Input() field: string;
	@Input() enabled: boolean;
	@Input() min: number;
	@Input() max: number;
	@Input() snapSensitivity = 3;
	@Input() knobs: readonly Knob[] | undefined;
	@Input() showCurrentValue: boolean | undefined;
	@Input() displayedValueUnit = '%';

	value: number;
	progress: number;
	left = 0;
	right = 0;
	leftThumb = 0;

	displayedValue: string;
	valueChanged: Subject<number> = new Subject<number>();

	private subscription: Subscription;

	constructor(
		protected override cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly el: ElementRef,
	) {
		super(cdr);
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
					this.prefs.setValue(this.field, this.value);
				}),
			)
			.subscribe();
	}

	@HostListener('window:beforeunload')
	override ngOnDestroy() {
		super.ngOnDestroy();
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
			: knob.percentageValue!;
		const boundingRect = this.el.nativeElement.querySelector('.slider').getBoundingClientRect();
		const width = boundingRect.width;
		const height = boundingRect.height;

		// Same as thumb positioning, see below
		const minLeft = 0 - height / 2;
		const maxLeft = width - height / 2;
		return minLeft + (valueInPercent / 100) * (maxLeft - minLeft);
	}

	private snapValue() {
		// Add snapping
		if (this.knobs) {
			for (const knob of this.knobs) {
				const snapTestValue = knob.absoluteValue
					? knob.absoluteValue
					: (knob.percentageValue! * (this.max - this.min)) / 100 + this.min;
				const delta = Math.abs(snapTestValue - this.value);
				const deltaPercent = (100 * delta) / (this.max - this.min);
				if (deltaPercent < this.snapSensitivity) {
					this.value = snapTestValue;
					this.updateValueElements();
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
		this.progress = 100 * ((this.value - this.min) / (this.max - this.min));
		// console.debug('progress', this.progress);
		this.displayedValue = this.value.toFixed(0) + this.displayedValueUnit;

		const boundingRect = this.el.nativeElement.querySelector('.slider').getBoundingClientRect();
		const width = boundingRect.width;
		const height = boundingRect.height;
		// console.debug('boundingRect', boundingRect, width, height);

		this.left = 0;
		this.right = ((100 - this.progress) * width) / 100;

		// Map the left values from (0, 100) to (0 - height / 2, 100 + height / 2)
		// to take into account the fact that the **center** of the knob is positioned
		// (while the CSS gives us the position of the left side of the thumb)
		const minLeftThumb = 0 - height / 2;
		const maxLeftThumb = width - height / 2;
		// console.debug('minLeftThumb', minLeftThumb, 'maxLeftThumb', maxLeftThumb);
		this.leftThumb = minLeftThumb + (this.progress / 100) * (maxLeftThumb - minLeftThumb);
		// console.debug(
		// 	'leftThumb',
		// 	this.leftThumb,
		// 	minLeftThumb,
		// 	this.progress,
		// 	maxLeftThumb,
		// 	maxLeftThumb - minLeftThumb,
		// );
	}
}

export interface Knob {
	readonly absoluteValue?: number;
	readonly percentageValue?: number;
	readonly label?: string;
}
