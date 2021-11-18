import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Output,
	ViewRef,
} from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { IOption } from 'ng-select';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { getTribeIcon } from '../services/battlegrounds/bgs-utils';
import { AppUiStoreFacadeService } from '../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../services/ui-store/app-ui-store.service';
import { areDeepEqual, removeFromReadonlyArray } from '../services/utils';
import { AbstractSubscriptionComponent } from './abstract-subscription.component';

@Component({
	selector: 'filter-dropdown-multiselect',
	styleUrls: [`../../css/component/filter-dropdown-multiselect.component.scss`],
	template: `
		<div class="filter-dropdown-multiselect" [ngClass]="{ 'showing': showing }" *ngIf="_visible">
			<div class="value" (click)="toggle()">
				<div class="text" [innerHTML]="valueText$ | async"></div>
				<div class="caret i-30">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#arrow" />
					</svg>
				</div>
			</div>
			<div
				class="options"
				*ngIf="
					showing && {
						workingOptions: (workingOptions$ | async) || [],
						validSelection: validSelection$ | async
					} as value
				"
			>
				<div class="choices">
					<div class="option" *ngFor="let option of value.workingOptions">
						<checkbox
							[label]="option.label"
							[value]="option.selected"
							(valueChanged)="select(option, $event)"
						></checkbox>
						<img class="icon" [src]="option.image" />
					</div>
				</div>
				<div class="controls">
					<div
						class="button apply"
						[ngClass]="{ 'disabled': !value.validSelection }"
						[helpTooltip]="buttonTooltip(value.validSelection)"
						(click)="confirmSelection(value.validSelection)"
					>
						Apply
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterDropdownMultiselectComponent extends AbstractSubscriptionComponent implements OnDestroy {
	@Output() onOptionSelected: EventEmitter<readonly string[]> = new EventEmitter<readonly string[]>();

	@Input() placeholder: string;
	@Input() set options(value: readonly IOption[]) {
		console.debug('setting optiosn', value);
		this.options$.next(value);
	}

	@Input() set selected(value: readonly string[]) {
		console.debug('setting selected', value);
		this.tempSelected$.next(value);
		this.selected$.next(value);
	}

	@Input() set visible(value: boolean) {
		this._visible = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	valueText$: Observable<string>;
	workingOptions$: Observable<readonly InternalOption[]>;
	validSelection$: Observable<boolean>;

	showing: boolean;

	_visible: boolean;
	_selected: readonly string[];

	private tempSelected$: BehaviorSubject<readonly string[]> = new BehaviorSubject(null);
	private options$: BehaviorSubject<readonly IOption[]> = new BehaviorSubject(null);
	private selected$: BehaviorSubject<readonly string[]> = new BehaviorSubject(null);

	private sub$$: Subscription;

	constructor(
		private readonly el: ElementRef,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		this.valueText$ = combineLatest(this.options$.asObservable(), this.selected$.asObservable()).pipe(
			filter(([options, selected]) => !!options?.length),
			map(([options, selected]) => {
				if (!selected?.length || selected.length === options.length) {
					return this.placeholder;
				}
				return this.buildIcons(
					selected
						.map((sel) => options.find((option) => option.value === sel))
						.sort((a, b) => (a.label < b.label ? -1 : 1)),
				);
			}),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
			tap((filter) => cdLog('emitting textValue in ', this.constructor.name, filter)),
			takeUntil(this.destroyed$),
		);
		// Reset the info every time the input options change
		this.sub$$ = this.options$
			.pipe(
				filter((options) => !!options),
				distinctUntilChanged((a, b) => areDeepEqual(a, b)),
			)
			.subscribe((options) => this.tempSelected$.next(options.map((option) => option.value)));
		this.workingOptions$ = combineLatest(this.options$.asObservable(), this.tempSelected$.asObservable()).pipe(
			filter(([options, tempSelected]) => !!options),
			distinctUntilChanged((a, b) => areDeepEqual(a, b)),
			map(([options, tempSelected]) => {
				return options.map((option) => ({
					...option,
					image: getTribeIcon(+option.value as Race),
					selected: tempSelected?.includes(option.value),
				}));
			}),
			tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
			tap((filter) => cdLog('emitting workingOptions in ', this.constructor.name, filter)),
			takeUntil(this.destroyed$),
		);
		this.validSelection$ = combineLatest(this.options$.asObservable(), this.workingOptions$).pipe(
			filter(([options, workingOptions]) => !!options),
			map(([options, workingOptions]) => this.isValidSelection(options, workingOptions)),
			distinctUntilChanged(),
			tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
			tap((filter) => cdLog('emitting validSelection in ', this.constructor.name, filter)),
			takeUntil(this.destroyed$),
		);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.sub$$?.unsubscribe();
	}

	@HostListener('document:click', ['$event'])
	docEvent($e: MouseEvent) {
		if (!this.showing) {
			return;
		}
		const paths: Array<HTMLElement> = $e['path'];
		if (!paths.some((p) => p === this.el.nativeElement)) {
			this.toggle();
		}
	}

	toggle() {
		this.showing = !this.showing;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	select(option: IOption, isSelected: boolean) {
		let tempSelected = this.tempSelected$.value;
		if (isSelected && !tempSelected.includes(option.value)) {
			tempSelected = [...tempSelected, option.value];
		} else if (!isSelected && tempSelected.includes(option.value)) {
			tempSelected = removeFromReadonlyArray(tempSelected, tempSelected.indexOf(option.value));
		}
		this.tempSelected$.next(tempSelected);
	}

	buttonTooltip(validSelection: boolean): string {
		return validSelection ? null : 'Please select either all tribes or only 5';
	}

	isValidSelection(options: readonly IOption[], workingOptions: readonly InternalOption[]): boolean {
		const selected = workingOptions.filter((option) => option.selected).length;
		const result = selected === 5 || selected === options.length;
		return result;
	}

	confirmSelection(validSelection: boolean) {
		if (!validSelection) {
			return;
		}
		const value = this.tempSelected$.value;
		this.onOptionSelected.next(value);
		this.toggle();
	}

	private buildIcons(options: IOption[]): string {
		const icons = options
			.map((option) => getTribeIcon(+option.value as Race))
			.map((icon) => `<img src="${icon}" class="icon" />`)
			.join('');
		return `<div class="selection-icons">${icons}</div>`;
	}
}

interface InternalOption extends IOption {
	readonly selected: boolean;
	readonly image: string;
}
