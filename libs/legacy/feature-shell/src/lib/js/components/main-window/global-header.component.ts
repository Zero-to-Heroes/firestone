import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { MainWindowNavigationService, MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NavigationBackEvent, NavigationNextEvent } from '@firestone/mainwindow/common';

@Component({
	standalone: false,
	selector: 'global-header',
	styleUrls: [
		`../../../css/global/menu.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/main-window-navigation.component.scss`,
		`../../../css/component/main-window/global-header.component.scss`,
	],
	template: `
		<div class="global-header" *ngIf="text$ | async as text">
			<i class="i-13X7 arrow back" (click)="back()" *ngIf="backArrow">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#collapse_caret" />
				</svg>
			</i>
			<img class="image" *ngIf="image$ | async as image" [src]="image" />
			<div class="text">{{ text }}</div>
			<!-- <i class="i-13X7 arrow next" (click)="next()" *ngIf="nextArrow$ | async">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#collapse_caret" />
				</svg>
			</i> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalHeaderComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	text$: Observable<string>;
	image$: Observable<string>;
	// backArrow$: Observable<boolean>;
	// nextArrow$: Observable<boolean>;

	@Input() backArrow: boolean;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly nav: MainWindowNavigationService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav);

		this.text$ = this.nav.text$$.pipe(
			filter((text) => !!text),
			this.mapData((text) => this.i18n.translateString(text)),
		);
		this.image$ = this.nav.image$$.pipe(
			filter((image) => !!image),
			this.mapData((image) => image),
		);
		// this.backArrow$ = this.nav.backArrowEnabled$$.pipe(this.mapData((backArrowEnabled) => backArrowEnabled));
		// this.nextArrow$ = this.nav.nextArrowEnabled$$.pipe(this.mapData((nextArrowEnabled) => nextArrowEnabled));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	back() {
		this.mainWindowStateFacade.send(new NavigationBackEvent());
	}

	next() {
		this.mainWindowStateFacade.send(new NavigationNextEvent());
	}
}
