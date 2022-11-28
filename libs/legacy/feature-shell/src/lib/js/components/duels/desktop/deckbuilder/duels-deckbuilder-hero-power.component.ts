import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { duelsHeroConfigs } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { DuelsDeckbuilderHeroPowerSelectedEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-hero-power-selected-decks-event';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'duels-deckbuilder-hero-power',
	styleUrls: [`../../../../../css/component/duels/desktop/deckbuilder/duels-deckbuilder-hero-power.component.scss`],
	template: `
		<div class="duels-deckbuilder-hero-power" role="list" *ngIf="heroPowerOptions$ | async as heroPowerOptions">
			<button
				class="hero-power"
				role="listitem"
				tabindex="0"
				*ngFor="let heroPower of heroPowerOptions; trackBy: trackByCardId"
				(click)="onHeroPowerCardClicked(heroPower)"
			>
				<img [src]="heroPower.cardImage" [alt]="heroPower.name" class="icon" />
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckbuilderHeroPowerComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	heroPowerOptions$: Observable<readonly HeroPowerOption[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.heroPowerOptions$ = this.store
			.listen$(([main, nav]) => main.duels.deckbuilder.currentHeroCardId)
			.pipe(
				this.mapData(([heroCardId]) => {
					const heroConfig = duelsHeroConfigs.find((config) => config.hero === heroCardId);
					const result = (heroConfig?.heroPowers ?? []).map((heroPower) => {
						return {
							cardId: heroPower,
							cardImage: this.i18n.getCardImage(heroPower),
							name: this.allCards.getCard(heroPower).name,
						};
					});
					return result;
				}),
			);
	}

	trackByCardId(index: number, item: HeroPowerOption) {
		return item.cardId;
	}

	onHeroPowerCardClicked(heroPower: HeroPowerOption) {
		this.store.send(new DuelsDeckbuilderHeroPowerSelectedEvent(heroPower.cardId));
	}
}

interface HeroPowerOption {
	readonly cardId: string;
	readonly cardImage: string;
	readonly name: string;
}
