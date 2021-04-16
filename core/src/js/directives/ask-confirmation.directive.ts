import { ConnectedPosition, Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
	AfterViewInit,
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
import { ConfirmationComponent } from '../components/tooltip/confirmation.component';
import { Events } from '../services/events.service';

@Directive({
	selector: '[confirmationTooltip]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class AskConfirmationDirective implements AfterViewInit, OnDestroy {
	@Input() askConfirmation: boolean;
	@Input() confirmationTitle: string;
	@Input() confirmationText: string;
	@Input() validButtonText: string;
	@Input() cancelButtonText: string;

	@Output() onConfirm: EventEmitter<boolean> = new EventEmitter<boolean>();

	private tooltipPortal;
	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy;

	constructor(
		private overlayPositionBuilder: OverlayPositionBuilder,
		private elementRef: ElementRef,
		private overlay: Overlay,
		private cdr: ChangeDetectorRef,
		private events: Events,
	) {}

	ngAfterViewInit() {
		this.updatePositionStrategy();
	}

	@HostListener('click', ['$event'])
	onClick() {
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
			// this.positionStrategy.detach();
			// this.positionStrategy.dispose();
			this.positionStrategy = null;
		}
		if (this.overlayRef) {
			this.cancel();
			// this.overlayRef.detach();
			// this.overlayRef.dispose();
		}
		const positions: ConnectedPosition[] = [
			{
				originX: 'end',
				originY: 'bottom',
				overlayX: 'end',
				overlayY: 'top',
			},
		];
		this.positionStrategy = this.overlayPositionBuilder
			// Create position attached to the elementRef
			.flexibleConnectedTo(this.elementRef)
			// Describe how to connect overlay to the elementRef
			.withPositions(positions);
		// console.log('[card-tooltip] elementRef', this.elementRef, positions, this.position);

		// Connect position strategy
		this.overlayRef = this.overlay.create({
			positionStrategy: this.positionStrategy,
			hasBackdrop: true,
			panelClass: ['modal'],
			backdropClass: 'confirmation-backdrop',
		});
		this.overlayRef.backdropClick().subscribe(() => this.cancel());
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		if (this.overlayRef) {
			this.positionStrategy.detach();
			// this.overlayRef.dispose();
			// if (!(this.cdr as ViewRef)?.destroyed) {
			// 	this.cdr.detectChanges();
			// }
		}
	}

	showConfirmationPopup() {
		// Create tooltip portal
		this.tooltipPortal = new ComponentPortal(ConfirmationComponent);

		// Attach tooltip portal to overlay
		const tooltipRef: ComponentRef<ConfirmationComponent> = this.overlayRef.attach(this.tooltipPortal);

		// Pass content to tooltip component instance
		this.confirmationTitle && (tooltipRef.instance.confirmationTitle = this.confirmationTitle);
		this.confirmationText && (tooltipRef.instance.confirmationText = this.confirmationText);
		this.validButtonText && (tooltipRef.instance.validButtonText = this.validButtonText);
		this.cancelButtonText && (tooltipRef.instance.cancelButtonText = this.cancelButtonText);
		tooltipRef.instance.onConfirm.subscribe(event => this.confirm());
		tooltipRef.instance.onCancel.subscribe(event => this.cancel());

		this.events.broadcast(Events.SHOW_MODAL);
		this.positionStrategy.apply();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private confirm() {
		if (this.overlayRef) {
			this.overlayRef.detach();
		}
		this.onConfirm.next(true);
	}

	private cancel() {
		console.log('canceling');
		this.overlayRef.detach();
		this.events.broadcast(Events.HIDE_MODAL);
		// this.overlayRef.dispose();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
