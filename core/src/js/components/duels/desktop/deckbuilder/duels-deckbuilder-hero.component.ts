import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardClass, CardIds, duelsHeroConfigs } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { DuelsDeckbuilderHeroSelectedEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-hero-selected-decks-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'duels-deckbuilder-hero',
	styleUrls: [`../../../../../css/component/duels/desktop/deckbuilder/duels-deckbuilder-hero.component.scss`],
	template: `
		<div class="duels-deckbuilder-hero" role="list">
			<button
				class="hero"
				role="listitem"
				tabindex="0"
				*ngFor="let hero of heroOptions; trackBy: trackByCardId"
				(click)="onHeroCardClicked(hero)"
			>
				<img [src]="hero.cardImage" [alt]="hero.name" class="portrait" />
				<div class="hero-name">{{ hero.name }}</div>
				<div class="classes" *ngIf="hero.classes?.length">
					<img
						*ngFor="let heroClass of hero.classes"
						[src]="heroClass.image"
						class="hero-class"
						[helpTooltip]="heroClass.name"
					/>
				</div>
				<div
					class="warning"
					*ngIf="hero.warning"
					inlineSVG="assets/svg/attention.svg"
					[helpTooltip]="hero.warning"
				></div>
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckbuilderHeroComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	heroOptions: readonly HeroOption[];

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.heroOptions = duelsHeroConfigs.map((config) => {
			return {
				cardId: config.hero,
				cardImage: this.i18n.getCardImage(config.hero, { isHeroSkin: true }),
				name: this.allCards.getCard(config.hero).name,
				classes: (config.heroClasses ?? []).map((c) => ({
					cardClass: c,
					name: this.i18n.translateString(`global.class.${CardClass[c].toLowerCase()}`),
					image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${CardClass[
						c
					].toLowerCase()}.png`,
				})),
				warning: this.getWarning(config.hero),
			};
		});
	}

	trackByCardId(index: number, item: HeroOption) {
		return item.cardId;
	}

	onHeroCardClicked(hero: HeroOption) {
		console.debug('clicked on', hero);
		this.store.send(new DuelsDeckbuilderHeroSelectedEvent(hero.cardId));
	}

	private getWarning(hero: CardIds): string {
		switch (hero) {
			case CardIds.VanndarStormpikeTavernBrawl:
			case CardIds.DrektharTavernBrawl:
				return this.i18n.translateString('app.duels.deckbuilder.warning.neutral-hero');
			case CardIds.BrannBronzebeardTavernBrawl5:
			case CardIds.RenoJacksonTavernBrawl5:
			case CardIds.EliseStarseekerTavernBrawl4:
			case CardIds.SirFinleyTavernBrawl5:
				return this.i18n.translateString('app.duels.deckbuilder.warning.loe-hero');
		}
	}
}

interface HeroOption {
	readonly cardId: string;
	readonly cardImage: string;
	readonly name: string;
	readonly classes: readonly HeroOptionClass[];
	readonly warning: string;
}

interface HeroOptionClass {
	readonly cardClass: CardClass;
	readonly image: string;
	readonly name: string;
}
