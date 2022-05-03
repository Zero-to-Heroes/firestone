import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { DuelsDeckbuilderGoBackEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-go-back-event';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

export const DEFAULT_CARD_WIDTH = 170;
export const DEFAULT_CARD_HEIGHT = 221;
@Component({
	selector: 'duels-deckbuilder-breadcrumbs',
	styleUrls: [`../../../../../css/component/duels/desktop/deckbuilder/duels-deckbuilder-breadcrumbs.component.scss`],
	template: `
		<div class="duels-deckbuilder-breadcrumbs">
			<div class="current-step">{{ currentStep$ | async }}</div>
			<div class="recap">
				<div
					class="recap-item recap-hero"
					*ngIf="currentHero$ | async as currentHero"
					(click)="goBack('hero')"
					[helpTooltip]="heroTooltip('hero', currentHero)"
				>
					<img [src]="currentHero.image" [alt]="currentHero.name" />
				</div>
				<div
					class="recap-item recap-hero-power"
					*ngIf="currentHeroPower$ | async as currentHeroPower"
					(click)="goBack('hero-power')"
					[helpTooltip]="heroTooltip('hero-power', currentHeroPower)"
				>
					<img [src]="currentHeroPower.image" [alt]="currentHeroPower.name" />
				</div>
				<div
					class="recap-item recap-signature-treasure"
					*ngIf="currentSignatureTreasure$ | async as currentSignatureTreasure"
					(click)="goBack('signature-treasure')"
					[helpTooltip]="heroTooltip('signature-treasure', currentSignatureTreasure)"
				>
					<img [src]="currentSignatureTreasure.image" [alt]="currentSignatureTreasure.name" />
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckbuilderBreadcrumbsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	currentStep$: Observable<string>;
	currentHero$: Observable<SelectionStep>;
	currentHeroPower$: Observable<SelectionStep>;
	currentSignatureTreasure$: Observable<SelectionStep>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.currentStep$ = this.store
			.listen$(([main, nav]) => main.duels.deckbuilder)
			.pipe(
				this.mapData(([deckbuilder]) => {
					if (!deckbuilder.currentHeroCardId) {
						return this.i18n.translateString('app.duels.deckbuilder.choose-your-hero-title');
					} else if (!deckbuilder.currentHeroPowerCardId) {
						return this.i18n.translateString('app.duels.deckbuilder.choose-your-hero-power-title');
					} else if (!deckbuilder.currentSignatureTreasureCardId) {
						return this.i18n.translateString('app.duels.deckbuilder.choose-your-signature-treasure-title');
					}
					return this.i18n.translateString('app.duels.deckbuilder.build-your-deck-title');
				}),
			);
		this.currentHero$ = this.store
			.listen$(([main, nav]) => main.duels.deckbuilder.currentHeroCardId)
			.pipe(
				this.mapData(([heroCardId]) => {
					return !!heroCardId
						? {
								cardId: heroCardId,
								name: this.allCards.getCard(heroCardId).name,
								image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${heroCardId}.jpg`,
						  }
						: null;
				}),
			);
		this.currentHeroPower$ = this.store
			.listen$(([main, nav]) => main.duels.deckbuilder.currentHeroPowerCardId)
			.pipe(
				this.mapData(([heroPowerCardId]) => {
					return !!heroPowerCardId
						? {
								cardId: heroPowerCardId,
								name: this.allCards.getCard(heroPowerCardId).name,
								image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${heroPowerCardId}.jpg`,
						  }
						: null;
				}),
			);
		this.currentSignatureTreasure$ = this.store
			.listen$(([main, nav]) => main.duels.deckbuilder.currentSignatureTreasureCardId)
			.pipe(
				this.mapData(([currentSignatureTreasureCardId]) => {
					return !!currentSignatureTreasureCardId
						? {
								cardId: currentSignatureTreasureCardId,
								name: this.allCards.getCard(currentSignatureTreasureCardId).name,
								image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${currentSignatureTreasureCardId}.jpg`,
						  }
						: null;
				}),
			);
	}

	goBack(step: 'hero' | 'hero-power' | 'signature-treasure') {
		this.store.send(new DuelsDeckbuilderGoBackEvent(step));
	}

	heroTooltip(step: 'hero' | 'hero-power' | 'signature-treasure', cardId: string) {
		const cardName = this.allCards.getCard(cardId).name;
		switch (step) {
			case 'hero':
				return this.i18n.translateString('app.duels.deckbuilder.go-back-hero', { selectedCardName: cardName });
			case 'hero-power':
				return this.i18n.translateString('app.duels.deckbuilder.go-back-hero-power', {
					selectedCardName: cardName,
				});
			case 'signature-treasure':
				return this.i18n.translateString('app.duels.deckbuilder.go-back-signature-treasure', {
					selectedCardName: cardName,
				});
		}
	}
}

interface SelectionStep {
	readonly cardId: string;
	readonly name: string;
	readonly image: string;
}
