import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

@Component({
	selector: 'confirmation',
	styleUrls: [`../../../css/component/tooltip/confirmation.component.scss`],
	template: `
		<div class="confirmation">
			<div class="title" *ngIf="confirmationTitle$ | async as title" [innerHTML]="title"></div>
			<div class="text" [innerHTML]="confirmationText$ | async"></div>
			<div class="buttons">
				<button class="ok" (click)="ok()" *ngIf="showOk$ | async">{{ validButtonText$ | async }}</button>
				<button class="cancel" (click)="cancel()">{{ cancelButtonText$ | async }}</button>
			</div>
			<button class="close-button" (click)="cancel()">
				<svg class="svg-icon-fill">
					<use
						xmlns:xlink="https://www.w3.org/1999/xlink"
						xlink:href="assets/svg/sprite.svg#window-control_close"
					></use>
				</svg>
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	@Output() onConfirm: EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output() onCancel: EventEmitter<boolean> = new EventEmitter<boolean>();

	confirmationTitle$: Observable<string>;
	confirmationText$: Observable<string>;
	validButtonText$: Observable<string>;
	cancelButtonText$: Observable<string>;
	showOk$: Observable<boolean>;

	private confirmationTitle$$ = new BehaviorSubject<string>(
		this.i18n.translateString('app.global.controls.default-confirmation-title'),
	);
	private confirmationText$$ = new BehaviorSubject<string>(
		this.i18n.translateString('app.global.controls.default-confirmation-text'),
	);
	private validButtonText$$ = new BehaviorSubject<string>(
		this.i18n.translateString('app.global.controls.default-validation-button'),
	);
	private cancelButtonText$$ = new BehaviorSubject<string>(
		this.i18n.translateString('app.global.controls.default-cancel-button'),
	);
	private showOk$$ = new BehaviorSubject<boolean>(true);

	@Input() set confirmationTitle(value: string) {
		this.confirmationTitle$$.next(value);
	}

	@Input() set confirmationText(value: string) {
		this.confirmationText$$.next(value);
	}

	@Input() set validButtonText(value: string) {
		this.validButtonText$$.next(value);
	}

	@Input() set cancelButtonText(value: string) {
		this.cancelButtonText$$.next(value);
	}

	@Input() set showOk(value: boolean) {
		this.showOk$$.next(value);
	}
	constructor(
		protected readonly cdr: ChangeDetectorRef,
		protected readonly store: AppUiStoreFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
		// FIXME: For some reason, lifecycle methods are not called systematically when using overlayref
		setTimeout(() => this.ngAfterContentInit(), 50);
	}

	ngAfterContentInit(): void {
		this.cancelButtonText$ = this.cancelButtonText$$.asObservable().pipe(this.mapData((info) => info));
		this.confirmationText$ = this.confirmationText$$.asObservable().pipe(this.mapData((info) => info));
		this.validButtonText$ = this.validButtonText$$.asObservable().pipe(this.mapData((info) => info));
		this.cancelButtonText$ = this.cancelButtonText$$.asObservable().pipe(this.mapData((info) => info));
		this.showOk$ = this.showOk$$.asObservable().pipe(this.mapData((info) => info));
		// Because we can't rely on the lifecycle methods
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	ok() {
		this.onConfirm.next(true);
	}

	cancel() {
		this.onCancel.next(true);
	}
}
