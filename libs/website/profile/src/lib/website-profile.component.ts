import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { WebsiteCoreState, getPremium } from '@firestone/website/core';
import { Store } from '@ngrx/store';
import { Observable, filter, tap } from 'rxjs';
import { initOwnProfileData } from './+state/website/pofile.actions';
import { WebsiteProfileState } from './+state/website/profile.models';
import { getLoaded } from './+state/website/profile.selectors';

@Component({
	selector: 'website-profile',
	styleUrls: [`./website-profile.component.scss`],
	template: `
		<with-loading [isLoading]="isLoading$ | async">
			<ng-content></ng-content>
		</with-loading>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	isLoading$: Observable<boolean>;
	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly store: Store<WebsiteProfileState>,
		private readonly coreStore: Store<WebsiteCoreState>,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		console.debug('after content init', 'ggaaaaa');
		this.isLoading$ = this.store.select(getLoaded).pipe(this.mapData((loaded) => !loaded));
		this.coreStore
			.select(getPremium)
			.pipe(
				tap((premium) => console.debug('retrieved premiummm', premium)),
				filter((premium) => !!premium),
				this.mapData((premium) => premium),
			)
			.subscribe((premium) => {
				// TODO: pass the current jwt token as well?
				console.debug('will init profile data');
				const action = initOwnProfileData();
				this.store.dispatch(action);
			});

		return;
	}
}
