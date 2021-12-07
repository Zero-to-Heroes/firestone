import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationService } from '../../../services/localization.service';
import { getHeroRole } from '../../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'mercenaries-hero-details',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-hero-details.component.scss`,
	],
	template: `
		<div class="mercenaries-hero-details" *ngIf="merc$ | async as merc">
			<div class="layout-main">
				<div class="first">
					<div class="portrait-container">
						<div class="portrait">
							<img class="icon" [src]="merc.portraitUrl" />
							<img class="frame" [src]="merc.frameUrl" />
						</div>
					</div>
					<div class="equipments">
						<div class="equipment-card" *ngFor="let equipment of merc.equipments">
							<img class="icon" [src]="equipment.imageUrl" />
						</div>
					</div>
				</div>
				<div class="second">
					<div class="abilities">
						<div class="ability-card" *ngFor="let ability of merc.abilities">
							<img class="icon" [src]="ability.imageUrl" />
						</div>
					</div>
				</div>
			</div>
			<div class="secondary">
				<div class="farm-spots"></div>
				<div class="tasks"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesHeroDetailsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	merc$: Observable<Merc>;

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		console.log('not implemented yuet');
		this.merc$ = this.store
			.listen$(
				([main, nav, prefs]) => nav.navigationMercenaries.selectedDetailsMercId,
				([main, nav, prefs]) => main.mercenaries.referenceData,
			)
			.pipe(
				this.mapData(([mercId, referenceData]) => {
					const refMerc = referenceData.mercenaries.find((merc) => merc.id === mercId);
					const refMercCard = this.allCards.getCardFromDbfId(refMerc.cardDbfId);
					const skin = refMerc.skins.find((skin) => skin.isDefaultVariation);
					const skinCardId = this.allCards.getCardFromDbfId(skin.cardId).id;
					return {
						cardId: skinCardId,
						portraitUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${skinCardId}.jpg`,
						// TODO: add golden / diamond selection
						frameUrl: this.buildHeroFrame(getHeroRole(refMercCard.mercenaryRole), 0),
						equipments: refMerc.equipments.map((refEquip) => {
							const currentRefEquip = refEquip.tiers[refEquip.tiers.length - 1];
							const cardId = this.allCards.getCardFromDbfId(currentRefEquip.cardDbfId).id;
							return {
								cardId: cardId,
								tier: currentRefEquip.tier,
								imageUrl: this.i18n.getCardImage(cardId, { isHighRes: true }),
							};
						}),
						abilities: refMerc.abilities.map((refAbility) => {
							const currentRefAbility = refAbility.tiers[refAbility.tiers.length - 1];
							const cardId = this.allCards.getCardFromDbfId(currentRefAbility.cardDbfId).id;
							return {
								cardId: cardId,
								tier: currentRefAbility.tier,
								imageUrl: this.i18n.getCardImage(cardId, { isHighRes: true }),
							};
						}),
					};
				}),
			);
	}

	buildHeroFrame(role: string, premium: number): string {
		switch (premium) {
			case 1:
				return `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_golden_${role}.png?v=5`;
			case 2:
				return `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_diamond_${role}.png?v=5`;
			case 0:
				return `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_${role}.png?v=5`;
		}
	}
}

interface Merc {
	cardId: string;
	portraitUrl: string;
	frameUrl: string;
	equipments: readonly Equip[];
	abilities: readonly Ability[];
}

interface Equip {
	cardId: string;
	tier: number;
	imageUrl: string;
}

interface Ability {
	cardId: string;
	tier: number;
	imageUrl: string;
}
