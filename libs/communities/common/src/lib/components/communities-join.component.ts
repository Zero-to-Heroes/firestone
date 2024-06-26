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
import { waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CommunityJoinService } from '../services/community-join.service';
import { CommunityNavigationService } from '../services/community-navigation.service';
import { CommunitiesJoinModalComponent } from './communities-join-modal.component';

@Component({
	selector: 'communities-join',
	styleUrls: [`./communities-join.component.scss`],
	template: `
		<div class="communities-join">
			<div class="error" *ngIf="error$ | async as error">{{ error }}</div>
			<div class="buttons">
				<div
					class="button create disabled"
					[helpTooltip]="
						'This feature is still in beta and under development. If you are a streamer and wish to create a guild, please message me on Discord (link at the top of the app)'
					"
				>
					<div class="image"></div>
					<div class="text">Create a guild</div>
				</div>
				<div class="button join" (click)="showJoinPopup()">
					<div class="image"></div>
					<div class="text">Join a guild</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunitiesJoinComponent extends AbstractSubscriptionComponent implements AfterContentInit, AfterViewInit {
	showModal$: Observable<boolean>;
	error$: Observable<string>;

	private showModal$$ = new BehaviorSubject<boolean>(false);

	protected overlayRef: OverlayRef;
	protected positionStrategy: PositionStrategy;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly overlay: Overlay,
		private readonly overlayPositionBuilder: OverlayPositionBuilder,
		private readonly nav: CommunityNavigationService,
		private readonly joinService: CommunityJoinService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.showModal$ = this.showModal$$.pipe(this.mapData((info) => info));
	}

	async ngAfterViewInit() {
		await waitForReady(this.nav, this.joinService);

		this.error$ = this.joinService.joinStatus$$.pipe(
			this.mapData((status) => {
				switch (status) {
					case 'error':
						return 'An error occurred while joining the guild';
					case 'joining':
						return 'Joining guild...';
					default:
						return '';
				}
			}),
		);
		this.positionStrategy = this.overlayPositionBuilder.global().centerHorizontally().centerVertically();
		this.overlayRef = this.overlay.create({
			positionStrategy: this.positionStrategy,
			hasBackdrop: true,
			backdropClass: 'social-share-backdrop',
		});
		this.overlayRef.backdropClick().subscribe(() => this.overlayRef.detach());

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	showJoinPopup() {
		this.showModal$$.next(true);
		const portal = new ComponentPortal(CommunitiesJoinModalComponent);

		const modalRef = this.overlayRef.attach(portal);
		modalRef.instance.successHandler = () => {
			this.overlayRef.detach();
			this.nav.changeCategory('my-communities');
		};
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}

		this.positionStrategy.apply();
	}
}
