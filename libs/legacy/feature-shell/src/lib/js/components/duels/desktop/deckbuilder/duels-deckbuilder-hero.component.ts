import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardClass, duelsHeroConfigs } from '@firestone-hs/reference-data';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { DuelsDeckbuilderHeroSelectedEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-hero-selected-decks-event';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'duels-deckbuilder-hero',
	styleUrls: [`../../../../../css/component/duels/desktop/deckbuilder/duels-deckbuilder-hero.component.scss`],
	template: `
		<div class="duels-deckbuilder-hero" role="list" scrollable>
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
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckbuilderHeroComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
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
			};
		});
	}

	trackByCardId(index: number, item: HeroOption) {
		return item.cardId;
	}

	onHeroCardClicked(hero: HeroOption) {
		this.store.send(new DuelsDeckbuilderHeroSelectedEvent(hero.cardId));
	}
}

interface HeroOption {
	readonly cardId: string;
	readonly cardImage: string;
	readonly name: string;
	readonly classes: readonly HeroOptionClass[];
}

interface HeroOptionClass {
	readonly cardClass: CardClass;
	readonly image: string;
	readonly name: string;
}
