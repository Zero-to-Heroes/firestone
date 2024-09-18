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
import { BehaviorSubject, Observable, debounceTime } from 'rxjs';

@Component({
	selector: 'fs-text-input',
	styleUrls: ['../button.scss', './text-input.component.scss'],
	template: `
		<div class="text-input">
			<label class="search-label">
				<i
					class="search-icon i-30"
					*ngIf="showSearchIcon"
					inlineSVG="assets/svg/search.svg"
					[helpTooltip]="tooltip"
				>
				</i>
				<input
					[ngModel]="value$ | async"
					[placeholder]="placeholder"
					(ngModelChange)="onValueChanged($event)"
					(mousedown)="preventDrag($event)"
				/>
			</label>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextInputComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	value$: Observable<string>;

	@Output() fsModelUpdate = new EventEmitter<string>();

	@Input() set value(value: string | null) {
		this.value$$.next(value);
	}
	@Input() placeholder: string;
	@Input() tooltip: string;
	@Input() debounceTime = 200;
	@Input() showSearchIcon = true;

	private value$$ = new BehaviorSubject<string | null>(null);

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

	onValueChanged(event: string) {
		this.value$$.next(event);
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}
}
