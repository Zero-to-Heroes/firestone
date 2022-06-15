import { ConnectedPosition, Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
	ChangeDetectorRef,
	ComponentRef,
	Directive,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Output,
	ViewRef,
} from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { ConfirmationComponent } from '../components/tooltip/confirmation.component';
import { Events } from '../services/events.service';
import { CardTooltipPositionType } from './card-tooltip-position.type';

@Directive({
	selector: '[confirmationTooltip]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class AskConfirmationDirective implements OnDestroy {
	@Input() askConfirmation: boolean;
	@Input() confirmationTitle: string;
	@Input() confirmationText: string;
	@Input() validButtonText: string;
	@Input() cancelButtonText: string;
	@Input() showOk = true;

	@Input() set confirmationPosition(value: CardTooltipPositionType) {
		if (value === this._confirmationPosition || value === 'none') {
			return;
		}

		this._confirmationPosition = value;
		// this.updatePositionStrategy();
	}

	@Output() onConfirm: EventEmitter<boolean> = new EventEmitter<boolean>();

	private _confirmationPosition: CardTooltipPositionType;
	private tooltipPortal;
	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy;

	constructor(
		private readonly overlayPositionBuilder: OverlayPositionBuilder,
		private readonly elementRef: ElementRef,
		private readonly overlay: Overlay,
		private readonly cdr: ChangeDetectorRef,
		private readonly events: Events,
		private readonly i18n: LocalizationFacadeService,
	) {}

	// eslint-disable-next-line @angular-eslint/use-lifecycle-interface
	// eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
	ngAfterViewInit() {
		// 	// this.updatePositionStrategy();
	}

	@HostListener('click', ['$event'])
	onClick(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (!this.askConfirmation) {
			this.confirm();
			return;
		} else {
			this.showConfirmationPopup();
		}
	}

	private updatePositionStrategy() {
		if (this.positionStrategy) {
			this.cancel();
			this.positionStrategy = null;
		} else if (this.overlayRef) {
			this.cancel();
		}
		let positions: ConnectedPosition[] = [
			{
				originX: 'end',
				originY: 'bottom',
				overlayX: 'end',
				overlayY: 'top',
			},
		];
		if (this._confirmationPosition === 'bottom-right' || this._confirmationPosition === 'right') {
			positions = [
				{
					originX: 'end',
					originY: 'bottom',
					overlayX: 'start',
					overlayY: 'top',
				},
			];
		}

		this.positionStrategy = this.overlayPositionBuilder
			// Create position attached to the elementRef
			.flexibleConnectedTo(this.elementRef)
			// Describe how to connect overlay to the elementRef
			.withPositions(positions);

		// Connect position strategy
		this.overlayRef = this.overlay.create({
			positionStrategy: this.positionStrategy,
			hasBackdrop: true,
			panelClass: ['modal'],
			backdropClass: 'confirmation-backdrop',
		});
		this.overlayRef.backdropClick().subscribe(() => this.cancel());
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		if (this.overlayRef) {
			this.positionStrategy.detach();
		}
	}

	showConfirmationPopup() {
		this.updatePositionStrategy();

		// Create tooltip portal
		this.tooltipPortal = new ComponentPortal(ConfirmationComponent);

		// Attach tooltip portal to overlay
		const tooltipRef: ComponentRef<ConfirmationComponent> = this.overlayRef.attach(this.tooltipPortal);

		// Pass content to tooltip component instance
		tooltipRef.instance.confirmationTitle =
			this.confirmationTitle ?? this.i18n.translateString('app.global.controls.default-confirmation-title');
		tooltipRef.instance.confirmationText =
			this.confirmationText ?? this.i18n.translateString('app.global.controls.default-confirmation-text');
		tooltipRef.instance.validButtonText =
			this.validButtonText ?? this.i18n.translateString('app.global.controls.default-validation-button');
		tooltipRef.instance.cancelButtonText =
			this.cancelButtonText ?? this.i18n.translateString('app.global.controls.default-cancel-button');
		tooltipRef.instance.showOk = this.showOk;
		tooltipRef.instance.onConfirm.subscribe((event) => this.confirm());
		tooltipRef.instance.onCancel.subscribe((event) => this.cancel());

		this.events.broadcast(Events.SHOW_MODAL);
		this.positionStrategy.apply();
		setTimeout(() => {
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	private confirm() {
		if (this.overlayRef) {
			this.overlayRef.detach();
		}
		this.onConfirm.next(true);
		this.events.broadcast(Events.HIDE_MODAL);
		// this.overlayRef.dispose();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private cancel() {
		this.overlayRef.detach();
		this.events.broadcast(Events.HIDE_MODAL);
		// this.overlayRef.dispose();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
