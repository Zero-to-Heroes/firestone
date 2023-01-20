import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

export const DEFAULT_CARD_WIDTH = 170;
export const DEFAULT_CARD_HEIGHT = 221;
@Component({
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
export class ConstructedDeckbuilderComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	currentStep$: Observable<CurrentStep>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.currentStep$ = this.store
			.listen$(([main, nav]) => main.decktracker.deckbuilder)
			.pipe(
				this.mapData(([deckbuilder]) => {
					if (!deckbuilder.currentFormat) {
						return 'format';
					} else if (!deckbuilder.currentClass) {
						return 'class';
					}
					return 'cards';
				}),
			);
	}
}

type CurrentStep = 'format' | 'class' | 'cards';
