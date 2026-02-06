import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { AnalyticsService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

export const DEFAULT_CARD_WIDTH = 170;
export const DEFAULT_CARD_HEIGHT = 221;
@Component({
	standalone: false,
	selector: 'constructed-deckbuilder',
	styleUrls: [`../../../../../css/component/decktracker/main/deckbuilder/constructed-deckbuilder.component.scss`],
	template: `
		<div class="constructed-deckbuilder">
			<constructed-deckbuilder-breadcrumbs></constructed-deckbuilder-breadcrumbs>
			<ng-container [ngSwitch]="currentStep$ | async">
				<ng-container *ngSwitchCase="'format'">
					<constructed-deckbuilder-format></constructed-deckbuilder-format
				></ng-container>
				<ng-container *ngSwitchCase="'class'">
					<constructed-deckbuilder-class></constructed-deckbuilder-class
				></ng-container>
				<ng-container *ngSwitchCase="'cards'">
					<constructed-deckbuilder-cards></constructed-deckbuilder-cards>
				</ng-container>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedDeckbuilderComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	currentStep$: Observable<CurrentStep>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly analytics: AnalyticsService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.mainWindowStateFacade);

		this.analytics.trackEvent('deckbuilder');
		this.currentStep$ = this.mainWindowStateFacade.mainWindowState$$
			.pipe(this.mapData((state) => state.decktracker.deckbuilder))
			.pipe(
				this.mapData((deckbuilder) => {
					if (!deckbuilder.currentFormat) {
						return 'format';
					} else if (!deckbuilder.currentClass) {
						return 'class';
					}
					return 'cards';
				}),
			);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}

type CurrentStep = 'format' | 'class' | 'cards';
