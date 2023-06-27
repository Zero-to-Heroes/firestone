import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnDestroy,
} from '@angular/core';
import { AbstractSubscriptionComponent, uuid } from '@firestone/shared/framework/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
	selector: 'fs-toggle-view',
	styleUrls: [`../label.scss`, `./toggle.scss`, `./toggle-view.component.scss`],
	template: `
		<div class="toggle-view" *ngIf="{ value: value$ | async } as value" [ngClass]="{ 'toggled-on': value.value }">
			<input
				hidden
				type="checkbox"
				[checked]="value.value"
				name=""
				id="a-01-{{ uniqueId }}"
				(change)="toggleValue()"
			/>
			<label class="toggle" for="a-01-{{ uniqueId }}" [ngClass]="{ enabled: value.value }">
				<b></b>
			</label>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleViewComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	value$: Observable<boolean>;

	uniqueId: string;

	@Input() set value(v: boolean) {
		this.value$$.next(v);
	}
	@Input() toggleFunction: (v: boolean) => void | Promise<void>;

	private value$$ = new BehaviorSubject<boolean>(false);

	constructor(protected override readonly cdr: ChangeDetectorRef) {
		super(cdr);
		this.uniqueId = uuid();
	}

	ngAfterContentInit() {
		this.value$ = this.value$$.asObservable().pipe(this.mapData((v) => v));
	}

	async toggleValue() {
		this.value$$.next(!this.value$$.value);
		this.toggleFunction(!this.value);
	}
}
