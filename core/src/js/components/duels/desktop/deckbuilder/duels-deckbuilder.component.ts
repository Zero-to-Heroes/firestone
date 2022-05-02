import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

export const DEFAULT_CARD_WIDTH = 170;
export const DEFAULT_CARD_HEIGHT = 221;
@Component({
	selector: 'duels-deckbuilder',
	styleUrls: [`../../../../../css/component/duels/desktop/deckbuilder/duels-deckbuilder.component.scss`],
	template: `
		<div class="duels-deckbuilder">
			<!-- First intermediate screen where you select Hero, Hero Power and Signature Treasure  -->
			<!-- Once these are selected, you're brought to the builder proper -->
			<!-- Header should recap this info, add a way to discard the current deck -->
			<!-- Area to the right should recap the mana curve and maybe other stats -->
			<!-- Need an area to at least search for cards or browse them all by class. Add at least 
			search keywords (like cost:2+ or school:fire) to avoid having too many icons, at least 
			at the beginning -->
			<!-- Need a way to see the buckets that will be offered with the current cards selection -->
			<!-- Need a way to import a deck code -->
			<!-- Need a way to use only your own collection -->
			<!-- Abillity to click on a card in the tracker and automatically filter the cards that synergize with it? -->
			<!-- Don't forget to only include the sets that are allowed in Duels -->
			<!-- Remove banned cards -->
			<!-- Filter by collection? -->
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
export class DuelsDeckbuilderComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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
