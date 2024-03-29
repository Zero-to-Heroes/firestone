/* eslint-disable @angular-eslint/template/eqeqeq */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ViewRef,
} from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { CommunitiesJoinModalComponent } from './communities-join-modal.component';

@Component({
	selector: 'communities-join',
	styleUrls: [`./communities-join.component.scss`],
	template: `
		<div class="communities-join">
			<div class="button create disabled">
				<div class="image"></div>
				<div class="text">Create a community</div>
			</div>
			<div class="button join" (click)="showJoinPopup()">
				<div class="image"></div>
				<div class="text">Join a community</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunitiesJoinComponent extends AbstractSubscriptionComponent implements AfterContentInit, AfterViewInit {
	showModal$: Observable<boolean>;

	private showModal$$ = new BehaviorSubject<boolean>(false);

	protected overlayRef: OverlayRef;
	protected positionStrategy: PositionStrategy;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly overlay: Overlay,
		private readonly overlayPositionBuilder: OverlayPositionBuilder,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.showModal$ = this.showModal$$.pipe(this.mapData((info) => info));
	}

	ngAfterViewInit(): void {
		this.positionStrategy = this.overlayPositionBuilder.global().centerHorizontally().centerVertically();
		this.overlayRef = this.overlay.create({
			positionStrategy: this.positionStrategy,
			hasBackdrop: true,
			backdropClass: 'social-share-backdrop',
		});
		this.overlayRef.backdropClick().subscribe(() => this.overlayRef.detach());
	}

	showJoinPopup() {
		this.showModal$$.next(true);
		const portal = new ComponentPortal(CommunitiesJoinModalComponent);

		const modalRef = this.overlayRef.attach(portal);
		modalRef.instance.closeHandler = () => this.overlayRef.detach();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}

		this.positionStrategy.apply();
	}
}
