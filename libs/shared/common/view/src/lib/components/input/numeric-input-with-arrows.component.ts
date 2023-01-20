import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	OnDestroy,
	Output,
} from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { BehaviorSubject, debounceTime, Observable } from 'rxjs';

@Component({
	selector: 'fs-numeric-input-with-arrows',
	styleUrls: ['../button.scss', './numeric-input-with-arrows.component.scss'],
	template: `
		<div class="input">
			<div class="label">{{ label }}</div>
			<input
				type="number"
				tabindex="0"
				[ngModel]="value$ | async"
				(ngModelChange)="onValueChanged($event)"
				(mousedown)="preventDrag($event)"
			/>
			<div class="buttons">
				<button
					class="arrow up"
					tabindex="-1"
					inlineSVG="assets/svg/arrow.svg"
					(click)="incrementValue()"
				></button>
				<button
					class="arrow down"
					tabindex="-1"
					inlineSVG="assets/svg/arrow.svg"
					(click)="decrementValue()"
				></button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumericInputWithArrowsComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	value$: Observable<number>;

	@Output() fsModelUpdate = new EventEmitter<number>();

	@Input() set value(v: number) {
		this.value$$.next(v);
	}
	@Input() label: string;
	@Input() minValue = -9999;
	@Input() debounceTime = 0;

	private value$$ = new BehaviorSubject<number>(0);

	constructor(protected override readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.value$ = this.value$$.asObservable().pipe(this.mapData((v) => v));
		this.value$
			.pipe(
				debounceTime(this.debounceTime),
				this.mapData((v) => v),
			)
			.subscribe((v) => this.fsModelUpdate.next(v));
	}

	incrementValue() {
		this.value$$.next(this.value$$.value + 1);
	}

	decrementValue() {
		this.value$$.next(Math.max(this.minValue, this.value$$.value - 1));
	}

	onValueChanged(event: number) {
		this.value$$.next(Math.max(this.minValue, event));
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}
}
