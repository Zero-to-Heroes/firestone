import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { RewardItemType } from '@firestone-hs/reference-data';
import { Observable } from 'rxjs';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationService } from '../../../services/localization.service';
import { getHeroRole } from '../../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { buildBounties } from '../../../services/ui-store/mercenaries-ui-helper';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { BountyForMerc } from './mercenaries-personal-hero-stats.component';

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
				<div class="section farm-spots">
					<div class="header">Farm coins in</div>
					<div class="spots block">
						<div class="spot" *ngFor="let bounty of merc.bounties">
							<div class="bounty-zone">{{ bounty.bountySetName }}</div>
							<div class="bounty-name">{{ bounty.bountyName }}</div>
						</div>
					</div>
				</div>
				<div class="section all-tasks">
					<div class="header">Tasks</div>
					<div class="tasks block">
						<div class="task" *ngFor="let bounty of merc.tasks">
							<div class="index">#{{ bounty.index }}</div>
							<div class="text">
								<div class="title">{{ bounty.title }}</div>
								<div class="description">{{ bounty.description }}</div>
							</div>
							<div class="rewards">
								<div class="reward" *ngFor="let reward of bounty.rewards">
									<div class="coin-container" *ngIf="reward.isCoin">
										<img class="icon" [src]="reward.imageUrl" />
										<img
											class="frame"
											src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_coin_empty.png?v=5"
										/>
										<div class="amount">{{ reward.quantity }}</div>
									</div>
									<div
										class="equip-container"
										*ngIf="reward.isEquipment"
										[cardTooltip]="reward.cardId"
									>
										<img class="icon" [src]="reward.imageUrl" />
										<img
											class="frame"
											src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_equipment_frame.png?v=3"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
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
					const refTasks = referenceData.taskChains.find((chain) => chain.mercenaryId === mercId).tasks;
					console.debug('refTasks', refTasks);
					const tasks: readonly TaskForMerc[] = refTasks.map((task, index) => {
						return {
							index: index + 1,
							description: task.description,
							title: task.title,
							rewards: task.rewards.map((reward) => {
								return {
									type: reward.type,
									quantity: reward.quantity,
									cardId: null,
									imageUrl: null,
								};
							}),
						};
					});
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
						bounties: buildBounties(refMerc, referenceData.bountySets),
						tasks: tasks,
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
	bounties: readonly BountyForMerc[];
	tasks: readonly TaskForMerc[];
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

interface TaskForMerc {
	index: number;
	title: string;
	description: string;
	rewards: readonly {
		type: RewardItemType;
		quantity: number;
		cardId: string;
		imageUrl: string;
		isCoin?: boolean;
		isEquipment?: boolean;
	}[];
}
