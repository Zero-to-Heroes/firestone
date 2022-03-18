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
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { IOption } from 'ng-select';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../services/ui-store/app-ui-store-facade.service';
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
					<div class="option" *ngFor="let option of value.workingOptions; trackBy: trackByFn">
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
						[owTranslate]="'app.global.controls.multiselect-validation-button'"
					></div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterDropdownMultiselectComponent extends AbstractSubscriptionComponent implements OnDestroy {
	@Output() onOptionSelected: EventEmitter<readonly string[]> = new EventEmitter<readonly string[]>();

	@Input() placeholder: string;
	@Input() set options(value: readonly MultiselectOption[]) {
		this.options$.next(value);
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
	@Input() validationErrorTooltip = this.i18n.translateString(
		'app.global.controls.multiselect-validation-error-tooltip',
	);

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

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
		// Not sure why, but if we call these in AfterContentInif, they are not properly refreshed
		// the first time (maybe because of "visible"?)
		this.valueText$ = combineLatest(this.options$.asObservable(), this.selected$.asObservable()).pipe(
			filter(([options, selected]) => !!options?.length),
			this.mapData(([options, selected]) => {
				if (!selected?.length || selected.length === options.length) {
					return this.placeholder;
				}
				return this.buildIcons(
					selected
						.map((sel) => options.find((option) => option.value === sel))
						.sort((a, b) => (a.label < b.label ? -1 : 1)),
				);
			}),
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
			this.mapData(([options, tempSelected]) => {
				return options.map((option) => ({
					...option,
					selected: tempSelected?.includes(option.value),
				}));
			}),
		);
		this.validSelection$ = combineLatest(this.options$.asObservable(), this.workingOptions$).pipe(
			filter(([options, workingOptions]) => !!options),
			this.mapData(([options, workingOptions]) => this.isValidSelection(options, workingOptions)),
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

	select(option: MultiselectOption, isSelected: boolean) {
		let tempSelected = this.tempSelected$.value;
		if (isSelected && !tempSelected.includes(option.value)) {
			tempSelected = [...tempSelected, option.value];
		} else if (!isSelected && tempSelected.includes(option.value)) {
			tempSelected = removeFromReadonlyArray(tempSelected, tempSelected.indexOf(option.value));
		}
		this.tempSelected$.next(tempSelected);
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
		this.onOptionSelected.next(value);
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
}

interface InternalOption extends MultiselectOption {
	readonly selected: boolean;
}
