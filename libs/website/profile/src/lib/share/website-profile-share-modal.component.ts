import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { WebsiteCoreState } from '@firestone/website/core';
import { Store } from '@ngrx/store';
import { Observable, tap } from 'rxjs';
import { shareProfile, stopProfileShare } from '../+state/website/pofile.actions';
import { ShareStatusMessageType, WebsiteProfileState } from '../+state/website/profile.models';
import { getShareAlias, getShareStatusMessage, isShowingShareModal } from '../+state/website/profile.selectors';

@Component({
	selector: 'website-profile-share-modal',
	styleUrls: [`./website-profile-share-modal.component.scss`],
	template: `
		<div class="profile-share-container" *ngIf="showing$ | async" (click)="closeModal($event)">
			<div class="profile-share-modal">
				<div class="profile-share-modal-title">Share your profile</div>
				<div class="profile-share-modal-content">
					<div class="profile-share-modal-content-text">
						Choose a dispay name, make your profile public, and share it with your friends by sending them
						the link below!
					</div>
					<div class="profile-share-modal-content-url">
						<div class="url-container">
							<div class="icon" inlineSVG="assets/svg/copy.svg" [cdkCopyToClipboard]="getFullUrl()"></div>
							<div class="url">{{ baseShareUrl }}</div>
							<input
								[formControl]="searchForm"
								[(ngModel)]="shareAlias"
								[placeholder]="shareAlias$ | async"
							/>
						</div>
					</div>
					<div class="status-message" *ngIf="shareStatusMessage$ | async as status">
						{{ getError(status) }}
					</div>
					<div class="buttons">
						<button class="button cancel-button" (click)="closeModal(null)">Cancel</button>
						<button
							class="button share-button"
							(click)="shareProfile()"
							[ngClass]="{ disabled: !shareAlias?.length }"
						>
							Share
						</button>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileShareModalComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showing$: Observable<boolean>;
	shareStatusMessage$: Observable<ShareStatusMessageType | undefined>;
	shareAlias$: Observable<string | undefined>;

	baseShareUrl: string;
	shareAlias: string;

	searchForm = new FormControl();

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly store: Store<WebsiteProfileState>,
		private readonly coreStore: Store<WebsiteCoreState>,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		console.debug('after content init', 'ggaaaaa');
		this.baseShareUrl = `${document.location.protocol}//${document.location.hostname}/profile/`;
		this.showing$ = this.store.select(isShowingShareModal).pipe(this.mapData((showing) => !!showing));
		this.shareAlias$ = this.store.select(getShareAlias).pipe(
			tap((info) => console.debug('share alias', info)),
			this.mapData((alias) => (!!alias?.length ? alias : '')),
		);
		this.shareStatusMessage$ = this.coreStore.select(getShareStatusMessage).pipe(this.mapData((info) => info));
	}

	getFullUrl(): string {
		return `${this.baseShareUrl}${this.shareAlias}`;
	}

	getError(status: ShareStatusMessageType | undefined) {
		switch (status) {
			case 'sharing':
				return 'Sharing...';
			case 'existing-alias':
				return 'This alias is already taken.';
			case 'success':
				return 'Profile shared! You can copy the URL above, send it to your friends, and close this window.';
			case 'error':
				return 'An unknown error occurred.';
			default:
				return null;
		}
	}

	shareProfile() {
		console.debug('sharing', this.shareAlias);
		this.store.dispatch(shareProfile({ shareAlias: this.shareAlias }));
	}

	closeModal(event: MouseEvent | null) {
		const shouldClose =
			event?.target == null || (event?.target as HTMLElement)?.classList?.contains('profile-share-container');
		console.debug('closing', shouldClose, event);
		if (shouldClose) {
			this.store.dispatch(stopProfileShare());
		}
	}
}
