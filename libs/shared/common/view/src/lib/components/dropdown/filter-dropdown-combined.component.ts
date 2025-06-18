/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Output,
	ViewChild,
	ViewRef,
} from '@angular/core';
import {
	AbstractSubscriptionComponent,
	arraysEqual,
	removeFromReadonlyArray,
} from '@firestone/shared/framework/common';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { MultiselectOption } from './filter-dropdown-multiselect.component';

@Component({
	selector: 'filter-dropdown-combined',
	styleUrls: [`./filter-dropdown-combined.component.scss`],
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
						validSelection: validSelection$ | async,
						allowMultipleSelection: allowMultipleSelection$ | async
					} as value
				"
			>
				<input
					class="text-input"
					*ngIf="allowSearch"
					#search
					[cdkTrapFocusAutoCapture]="showing"
					[cdkTrapFocus]="showing"
					[autofocus]="true"
					[ngModel]="currentSearch$ | async"
					(ngModelChange)="onCurrentSearchChanged($event)"
					(mousedown)="preventDrag($event)"
				/>
				<virtual-scroller
					#scroll
					[items]="value.workingOptions!"
					[bufferAmount]="25"
					role="list"
					class="choices"
					scrollable
				>
					<div class="option" *ngFor="let option of scroll.viewPortItems; trackBy: trackByFn">
						<checkbox
							class="checkbox-option"
							*ngIf="value.allowMultipleSelection"
							[label]="option.label"
							[value]="option.selected"
							[image]="option.image"
							[labelTooltip]="option.tooltip"
							(valueChanged)="select(option, $event)"
						></checkbox>
						<div *ngIf="!value.allowMultipleSelection" class="single-option" (click)="select(option, true)">
							<img class="image" *ngIf="option.image" [src]="option.image" />
							<span
								[helpTooltip]="option.tooltip ?? option.label"
								[ngClass]="{ unselectable: option.unselectable }"
								[innerHTML]="option?.label"
							></span>
							<div class="tooltip" *ngIf="option.tooltip" [helpTooltip]="option.tooltip">
								<svg>
									<use xlink:href="assets/svg/sprite.svg#info" />
								</svg>
							</div>
							<i class="i-30 selected-icon" *ngIf="option.selected">
								<svg class="svg-icon-fill">
									<use xlink:href="assets/svg/sprite.svg#selected_dropdown" />
								</svg>
							</i>
						</div>
					</div>
				</virtual-scroller>
				<div class="controls" *ngIf="value.allowMultipleSelection">
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
export class FilterDropdownCombinedComponent
	extends AbstractSubscriptionComponent
	implements OnDestroy, AfterContentInit
{
	valueText$: Observable<string>;
	workingOptions$: Observable<InternalOption[]>;
	validSelection$: Observable<boolean>;
	currentSearch$: Observable<string | null>;
	allowMultipleSelection$: Observable<boolean>;

	@ViewChild('search') searchInput: ElementRef;

	@Output() optionSelected: EventEmitter<readonly string[]> = new EventEmitter<readonly string[]>();

	@Input() placeholder: string;
	@Input() set options(value: readonly MultiselectOption[] | null) {
		this.options$.next(value?.filter((option) => !!option) ?? []);
	}

	@Input() set selected(value: readonly string[]) {
		this.tempSelectedValues$.next(value);
		this.selected$.next(value);
	}

	@Input() set visible(value: boolean) {
		this._visible = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set allowMultipleSelection(value: boolean) {
		this.allowMultipleSelection$$.next(value);
	}

	@Input() resetIsClear: boolean;
	@Input() allowSearch: boolean;
	@Input() validSelectionNumber: number;
	@Input() validationErrorTooltip: string;
	@Input() debounceTime = 200;

	showing: boolean;

	_visible: boolean;
	_selected: readonly string[];

	private tempSelectedValues$: BehaviorSubject<readonly string[] | null> = new BehaviorSubject<
		readonly string[] | null
	>(null);
	private tempSelected$: BehaviorSubject<readonly MultiselectOption[] | null> = new BehaviorSubject<
		readonly MultiselectOption[] | null
	>(null);
	private options$: BehaviorSubject<readonly MultiselectOption[] | null> = new BehaviorSubject<
		readonly MultiselectOption[] | null
	>(null);
	private selected$: BehaviorSubject<readonly string[] | null> = new BehaviorSubject<readonly string[] | null>(null);
	private currentSearch$$ = new BehaviorSubject<string | null>(null);
	private allowMultipleSelection$$ = new BehaviorSubject<boolean>(false);

	private sub$$: Subscription;

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly el: ElementRef) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.allowMultipleSelection$ = this.allowMultipleSelection$$.pipe(this.mapData((v) => v));
		// Not sure why, but if we call these in AfterContentInif, they are not properly refreshed
		// the first time (maybe because of "visible"?)
		combineLatest([this.options$, this.tempSelectedValues$])
			.pipe(
				filter(([options, tempSelectedValues]) => !!options?.length),
				this.mapData(([options, tempSelectedValues]) => {
					const tempSelected = options!.filter((option) =>
						tempSelectedValues?.some((e) => option.value === e),
					);
					return tempSelected;
				}),
			)
			.subscribe((tempSelected) => this.tempSelected$.next(tempSelected));
		this.valueText$ = combineLatest([
			this.options$.asObservable(),
			this.selected$.asObservable(),
			this.allowMultipleSelection$$,
		]).pipe(
			filter(([options, selected]) => !!options?.length),
			this.mapData(([options, selected, allowMultipleSelection]) => {
				if (allowMultipleSelection) {
					if (!selected?.length || selected.length === options!.length) {
						return this.placeholder;
					}
					const result = this.buildIcons(
						selected
							.map((sel) => options!.find((option) => option.value === sel))
							.filter((option) => !!option)
							.sort((a, b) => a?.label?.localeCompare(b?.label ?? '') ?? 0) as MultiselectOption[],
					);
					return result;
				} else {
					const selectedOption = options!.find((option) => option.value === selected?.[0]);
					return selectedOption?.label ?? this.placeholder;
				}
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
					options!.filter((option) => this.tempSelected$.value?.some((e) => option.value === option.value)),
				);
			});
		this.workingOptions$ = combineLatest([
			this.options$.asObservable(),
			this.tempSelected$.asObservable(),
			this.currentSearch$$,
		]).pipe(
			filter(([options, tempSelected, currentSearch]) => !!options),
			debounceTime(this.debounceTime),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([options, tempSelected, currentSearch]) => {
				tempSelected = tempSelected ?? [];
				const result = options!
					.filter(
						(option) =>
							!currentSearch?.length ||
							option.label.toLowerCase().includes(currentSearch.toLowerCase()) ||
							tempSelected!.some((o) => o.value === option.value),
					)
					.map((option) => ({
						...option,
						selected: tempSelected!.some((o) => o.value === option.value),
					}));
				return result;
			}),
		);
		this.validSelection$ = combineLatest([this.options$.asObservable(), this.workingOptions$]).pipe(
			filter(([options, workingOptions]) => !!options),
			this.mapData(([options, workingOptions]) => this.isValidSelection(options!, workingOptions)),
		);
		this.currentSearch$ = this.currentSearch$$.asObservable().pipe(this.mapData((v) => v));
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
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		// setTimeout
		// if (this.showing && this.allowSearch) {
		// 	this.searchInput.nativeElement.focus();
		// }
	}

	select(option: MultiselectOption, isSelected: boolean) {
		if (!this.allowMultipleSelection) {
			this.tempSelected$.next([option]);
			this.confirmSelection(true);
		} else {
			let tempSelected = this.tempSelected$.value;
			if (isSelected && !tempSelected?.some((o) => o.value === option.value)) {
				tempSelected = [...(tempSelected ?? []), option];
			} else if (!isSelected && tempSelected?.some((o) => o.value === option.value)) {
				tempSelected = removeFromReadonlyArray(
					tempSelected,
					tempSelected.map((e) => e.value).indexOf(option.value),
				);
			}
			this.tempSelected$.next(tempSelected);
		}
	}

	clearSelection() {
		this.tempSelected$.next([]);
		this.currentSearch$$.next(null);
	}

	resetSelection() {
		if (this.resetIsClear) {
			this.clearSelection();
		} else {
			this.tempSelected$.next(this.options$.value);
			this.currentSearch$$.next(null);
		}
	}

	buttonTooltip(validSelection: boolean | null): string | null {
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

	confirmSelection(validSelection: boolean | null) {
		if (!validSelection) {
			return;
		}
		// If you do this, selected items that don't match the current search won't be returned
		// Since all selected items are always displayed, I think we can only rely on the selected / unselected
		// character of an option
		// const value = this.tempSelected$.value.filter((option) =>
		// 	!this.currentSearch$$.value?.length
		// 		? true
		// 		: option.label.toLowerCase().includes(this.currentSearch$$.value.toLowerCase()),
		// );
		const value = this.tempSelected$.value;
		this.optionSelected.next(value?.map((o) => o.value) ?? []);
		this.toggle();
	}

	trackByFn(index: number, item: InternalOption) {
		return item.value;
	}

	onCurrentSearchChanged(event: string) {
		this.currentSearch$$.next(event);
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	private buildIcons(options: MultiselectOption[]): string {
		const icons = options.map((option) => `<img src="${option.image}" class="icon" />`).join('');
		return `<div class="selection-icons">${icons}</div>`;
	}
}

interface InternalOption extends MultiselectOption {
	readonly selected: boolean;
}
