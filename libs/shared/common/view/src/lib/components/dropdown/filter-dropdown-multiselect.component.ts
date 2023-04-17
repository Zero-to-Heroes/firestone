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
import {
	AbstractSubscriptionComponent,
	arraysEqual,
	removeFromReadonlyArray,
} from '@firestone/shared/framework/common';
import { IOption } from 'ng-select';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';

@Component({
	selector: 'filter-dropdown-multiselect',
	styleUrls: [`./filter-dropdown-multiselect.component.scss`],
	template: `
		<div class="filter-dropdown-multiselect" [ngClass]="{ showing: showing }" *ngIf="_visible">
			<div class="value" (click)="toggle()">
				<div class="text" [innerHTML]="valueText$ | async"></div>
				<div class="caret" inlineSVG="assets/svg/arrow.svg"></div>
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
				<div class="choices" scrollable>
					<div class="option" *ngFor="let option of value.workingOptions; trackBy: trackByFn">
						<checkbox
							[label]="option.label"
							[value]="option.selected"
							[image]="option.image"
							[labelTooltip]="option.tooltip"
							(valueChanged)="select(option, $event)"
						></checkbox>
					</div>
				</div>
				<div class="controls">
					<div
						class="button clear"
						(click)="clearSelection()"
						[fsTranslate]="'app.global.controls.multiselect-clear-button'"
					></div>
					<div
						class="button reset"
						(click)="resetSelection()"
						[fsTranslate]="'app.global.controls.multiselect-reset-button'"
					></div>
					<div
						class="button apply"
						[ngClass]="{ disabled: !value.validSelection }"
						[helpTooltip]="buttonTooltip(value.validSelection)"
						(click)="confirmSelection(value.validSelection)"
						[fsTranslate]="'app.global.controls.multiselect-validation-button'"
					></div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterDropdownMultiselectComponent extends AbstractSubscriptionComponent implements OnDestroy {
	@Output() optionSelected: EventEmitter<readonly string[]> = new EventEmitter<readonly string[]>();

	@Input() placeholder: string;
	@Input() set options(value: readonly MultiselectOption[] | null) {
		this.options$.next(value?.filter((option) => !!option) ?? []);
	}

	@Input() set selected(value: readonly string[]) {
		this.tempSelected$.next(value);
		this.selected$.next(value);
	}

	@Input() set visible(value: boolean) {
		this._visible = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() validSelectionNumber: number;
	@Input() validationErrorTooltip: string;

	valueText$: Observable<string>;
	workingOptions$: Observable<readonly InternalOption[]>;
	validSelection$: Observable<boolean>;

	showing: boolean;

	_visible: boolean;
	_selected: readonly string[];

	private tempSelected$: BehaviorSubject<readonly string[]> = new BehaviorSubject(null);
	private options$: BehaviorSubject<readonly MultiselectOption[]> = new BehaviorSubject(null);
	private selected$: BehaviorSubject<readonly string[]> = new BehaviorSubject(null);

	private sub$$: Subscription;

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly el: ElementRef) {
		super(cdr);
		// Not sure why, but if we call these in AfterContentInif, they are not properly refreshed
		// the first time (maybe because of "visible"?)
		this.valueText$ = combineLatest([this.options$.asObservable(), this.selected$.asObservable()]).pipe(
			filter(([options, selected]) => !!options?.length),
			this.mapData(([options, selected]) => {
				if (!selected?.length || selected.length === options.length) {
					return this.placeholder;
				}
				const result = this.buildIcons(
					selected
						.map((sel) => options.find((option) => option.value === sel))
						.filter((option) => !!option)
						.sort((a, b) => (a.label < b.label ? -1 : 1)),
				);
				return result;
			}),
		);
		// Reset the info every time the input options change
		this.sub$$ = this.options$
			.pipe(
				filter((options) => !!options),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
			)
			.subscribe((options) => {
				this.tempSelected$.next(
					options
						.map((option) => option.value)
						.filter((option) => this.tempSelected$.value?.includes(option)),
				);
			});
		this.workingOptions$ = combineLatest([this.options$.asObservable(), this.tempSelected$.asObservable()]).pipe(
			filter(([options, tempSelected]) => !!options),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([options, tempSelected]) => {
				const result = options.map((option) => ({
					...option,
					selected: tempSelected?.includes(option.value),
				}));
				return result;
			}),
		);
		this.validSelection$ = combineLatest([this.options$.asObservable(), this.workingOptions$]).pipe(
			filter(([options, workingOptions]) => !!options),
			this.mapData(([options, workingOptions]) => this.isValidSelection(options, workingOptions)),
		);
	}

	@HostListener('window:beforeunload')
	override ngOnDestroy() {
		super.ngOnDestroy();
		this.sub$$?.unsubscribe();
	}

	@HostListener('document:click', ['$event'])
	docEvent($e: MouseEvent) {
		if (!this.showing) {
			return;
		}
		const paths: Array<HTMLElement> = $e['path'];
		if (paths?.length && !paths.some((p) => p === this.el.nativeElement)) {
			this.toggle();
		}
	}

	toggle() {
		this.showing = !this.showing;
		console.debug('toggle', this.showing);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	select(option: MultiselectOption, isSelected: boolean) {
		let tempSelected = this.tempSelected$.value;
		if (isSelected && !tempSelected.includes(option.value)) {
			tempSelected = [...tempSelected, option.value];
		} else if (!isSelected && tempSelected.includes(option.value)) {
			tempSelected = removeFromReadonlyArray(tempSelected, tempSelected.indexOf(option.value));
		}
		this.tempSelected$.next(tempSelected);
	}

	clearSelection() {
		this.tempSelected$.next([]);
	}

	resetSelection() {
		this.tempSelected$.next(this.options$.value.map((option) => option.value));
	}

	buttonTooltip(validSelection: boolean): string {
		return validSelection ? null : this.validationErrorTooltip;
	}

	isValidSelection(options: readonly MultiselectOption[], workingOptions: readonly InternalOption[]): boolean {
		if (this.validSelectionNumber == null) {
			return true;
		}
		const selected = workingOptions.filter((option) => option.selected).length;
		const result = selected === this.validSelectionNumber || selected === options.length;
		return result;
	}

	confirmSelection(validSelection: boolean) {
		if (!validSelection) {
			return;
		}
		const value = this.tempSelected$.value;
		this.optionSelected.next(value);
		this.toggle();
	}

	trackByFn(index: number, item: InternalOption) {
		return item.value;
	}

	private buildIcons(options: MultiselectOption[]): string {
		const icons = options.map((option) => `<img src="${option.image}" class="icon" />`).join('');
		return `<div class="selection-icons">${icons}</div>`;
	}
}

export interface MultiselectOption extends IOption {
	readonly image: string;
	readonly tooltip?: string;
}

interface InternalOption extends MultiselectOption {
	readonly selected: boolean;
}
