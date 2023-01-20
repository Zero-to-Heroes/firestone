import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

export const DEFAULT_CARD_WIDTH = 170;
export const DEFAULT_CARD_HEIGHT = 221;
@Component({
	selector: 'duels-deckbuilder',
	styleUrls: [`../../../../../css/component/duels/desktop/deckbuilder/duels-deckbuilder.component.scss`],
	template: `
		<div class="duels-deckbuilder">
			<!-- Area to the right should recap the mana curve and maybe other stats -->
			<!-- Need a way to import a deck code -->
			<!-- Need a way to use only your own collection -->
			<!-- Abillity to click on a card in the tracker and automatically filter the cards that synergize with it? -->
			<duels-deckbuilder-breadcrumbs></duels-deckbuilder-breadcrumbs>
			<ng-container [ngSwitch]="currentStep$ | async">
				<ng-container *ngSwitchCase="'hero'"> <duels-deckbuilder-hero></duels-deckbuilder-hero></ng-container>
				<ng-container *ngSwitchCase="'hero-power'">
					<duels-deckbuilder-hero-power></duels-deckbuilder-hero-power
				></ng-container>
				<ng-container *ngSwitchCase="'signature-treasure'">
					<duels-deckbuilder-signature-treasure></duels-deckbuilder-signature-treasure
				></ng-container>
				<ng-container *ngSwitchCase="'cards'">
					<duels-deckbuilder-cards></duels-deckbuilder-cards>
				</ng-container>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckbuilderComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	currentStep$: Observable<CurrentStep>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.currentStep$ = this.store
			.listen$(([main, nav]) => main.duels.deckbuilder)
			.pipe(
				this.mapData(([deckbuilder]) => {
					if (!deckbuilder.currentHeroCardId) {
						return 'hero';
					} else if (!deckbuilder.currentHeroPowerCardId) {
						return 'hero-power';
					} else if (!deckbuilder.currentSignatureTreasureCardId) {
						return 'signature-treasure';
					}
					return 'cards';
				}),
			);
	}
}

type CurrentStep = 'hero' | 'hero-power' | 'signature-treasure' | 'cards';
