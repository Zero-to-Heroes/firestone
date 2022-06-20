import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MercenarySelector, RewardItemType } from '@firestone-hs/reference-data';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationService } from '../../../services/localization.service';
import { getHeroRole } from '../../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { buildBounties } from '../../../services/ui-store/mercenaries-ui-helper';
import { capitalizeFirstLetter, groupByFunction } from '../../../services/utils';
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
						<div class="controls">
							<div class="control premium">
								<button
									class="arrow left"
									inlineSVG="assets/svg/arrow.svg"
									(click)="decrementPremium()"
								></button>
								<div class="text">{{ merc.premium }}</div>
								<button
									class="arrow right"
									inlineSVG="assets/svg/arrow.svg"
									(click)="incrementPremium()"
								></button>
							</div>
							<div class="control skin">
								<button
									class="arrow left"
									inlineSVG="assets/svg/arrow.svg"
									(click)="decrementSkin()"
								></button>
								<div class="text">Art</div>
								<button
									class="arrow right"
									inlineSVG="assets/svg/arrow.svg"
									(click)="incrementSkin()"
								></button>
							</div>
							<div class="control level">
								<button
									class="arrow left"
									inlineSVG="assets/svg/arrow.svg"
									(click)="decrementLevel()"
								></button>
								<div class="text">{{ merc.levelText }}</div>
								<button
									class="arrow right"
									inlineSVG="assets/svg/arrow.svg"
									(click)="incrementLevel()"
								></button>
							</div>
						</div>
						<div class="portrait">
							<img class="icon" [src]="merc.portraitUrl" />
							<img class="frame" [src]="merc.frameUrl" />
							<div class="stats">
								<div class="attack">{{ merc.attack }}</div>
								<div class="health">{{ merc.health }}</div>
							</div>
						</div>
					</div>
					<div class="equipments">
						<div class="equipment-card" *ngFor="let equipment of merc.equipments; let i = index">
							<img class="icon" [src]="equipment.imageUrl" />
							<div class="controls">
								<button
									class="arrow left"
									inlineSVG="assets/svg/arrow.svg"
									(click)="decrementEquipmentLevel(i)"
								></button>
								<button
									class="arrow right"
									inlineSVG="assets/svg/arrow.svg"
									(click)="incrementEquipmentLevel(i)"
								></button>
							</div>
						</div>
					</div>
				</div>
				<div class="second">
					<div class="abilities">
						<div class="ability-card" *ngFor="let ability of merc.abilities">
							<img class="icon" [src]="ability.imageUrl" />
							<div class="controls">
								<button
									class="arrow left"
									inlineSVG="assets/svg/arrow.svg"
									(click)="decrementAbilityLevel(i)"
								></button>
								<button
									class="arrow right"
									inlineSVG="assets/svg/arrow.svg"
									(click)="incrementAbilityLevel(i)"
								></button>
							</div>
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
							<div class="bounty-name" *ngFor="let name of bounty.bountyNames">{{ name }}</div>
						</div>
					</div>
				</div>
				<div class="section all-tasks">
					<div class="header">Tasks</div>
					<div class="tasks block" scrollable>
						<div class="task" *ngFor="let bounty of merc.tasks">
							<div class="index">#{{ bounty.index }}</div>
							<div class="text">
								<div class="title">{{ bounty.title }}</div>
								<div class="description">{{ bounty.description }}</div>
							</div>
							<div class="rewards">
								<div class="reward" *ngFor="let reward of bounty.rewards">
									<div class="coin-container" *ngIf="reward.isCoin && !reward.isRandomCoin">
										<img class="icon" [src]="reward.imageUrl" />
										<img
											class="frame"
											src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_coin_empty.png"
										/>
										<div class="amount">{{ reward.quantity }}</div>
									</div>
									<div class="coin-container" *ngIf="reward.isCoin && reward.isRandomCoin">
										<img class="frame relative" [src]="reward.imageUrl" />
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
											src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_equipment_frame.png"
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

	premium = new BehaviorSubject<'normal' | 'golden' | 'diamond'>('normal');
	skinIndex = new BehaviorSubject<number>(0);
	level = new BehaviorSubject<number>(31);
	equipmentLevels = new BehaviorSubject<readonly number[]>([4, 4, 4]);
	abilityLevels = new BehaviorSubject<readonly number[]>([5, 5, 5]);

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
		this.merc$ = combineLatest(
			this.store.listen$(
				([main, nav, prefs]) => nav.navigationMercenaries.selectedDetailsMercId,
				([main, nav, prefs]) => main.mercenaries.referenceData,
			),
			this.premium.asObservable(),
			this.skinIndex.asObservable(),
			this.level.asObservable(),
			this.equipmentLevels.asObservable(),
			this.abilityLevels.asObservable(),
		).pipe(
			this.mapData(([[mercId, referenceData], premium, skinIndex, level, equipmentLevels, abilityLevels]) => {
				const refMerc = referenceData.mercenaries.find((merc) => merc.id === mercId);
				const refMercCard = this.allCards.getCardFromDbfId(refMerc.cardDbfId);
				const allSkins = [...refMerc.skins].sort((a, b) => {
					if (a.isDefaultVariation) {
						return -1;
					}
					if (b.isDefaultVariation) {
						return 1;
					}
					return a.artVariationId - b.artVariationId;
				});
				let skinValue = skinIndex % allSkins.length;
				if (skinValue < 0) {
					skinValue += allSkins.length;
				}
				const skin = allSkins[skinValue];
				console.debug('selecting skin', skin, skinValue, skinIndex, allSkins);
				const skinCardId = this.allCards.getCardFromDbfId(skin.cardId).id;
				const refTasks = referenceData.taskChains.find((chain) => chain.mercenaryId === mercId).tasks;
				console.debug('refTasks', refTasks);
				const tasks: readonly TaskForMerc[] = refTasks.map((task, index) => {
					return {
						index: index + 1,
						description: task.description,
						title: task.title,
						rewards: task.rewards.map((reward) => {
							const isEquipment = reward.type === RewardItemType.MERCENARY_EQUIPMENT;
							const imageUrl = isEquipment
								? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${
										this.allCards.getCardFromDbfId(reward.equipmentDbfId).id
								  }.jpg`
								: reward.mercenarySelector === MercenarySelector.CONTEXT
								? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${refMercCard.id}.jpg`
								: `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_random_coin.png`;
							return {
								type: reward.type,
								quantity: reward.quantity,
								cardId: null,
								imageUrl: imageUrl,
								isCoin: reward.type === RewardItemType.MERCENARY_CURRENCY,
								isRandomCoin: reward.mercenarySelector !== MercenarySelector.CONTEXT,
								isEquipment: isEquipment,
							};
						}),
					};
				});
				const refBounties = buildBounties(refMerc, referenceData.bountySets);
				const groupedBounties = groupByFunction((bounty: BountyForMerc) => bounty.bountySetName)(refBounties);
				const finalBounties: readonly BountyForMercInternal[] = Object.values(groupedBounties).map(
					(bounties) => {
						return {
							bountySetName: bounties[0].bountySetName,
							sortOrder: bounties[0].sortOrder,
							bountyNames: [...bounties]
								.sort((a, b) => a.sortOrder - b.sortOrder)
								.map((b) => b.bountyName),
						};
					},
				);
				console.debug('finalBountyies', finalBounties);
				const isMaxed = level === 31;
				const levelStat = refMerc.stats.find((stat) => (isMaxed ? stat.level === 30 : level === stat.level));
				const attack = levelStat.attack + (isMaxed ? 1 : 0);
				const health = levelStat.health + (isMaxed ? 5 : 0);

				return {
					cardId: skinCardId,
					portraitUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${skinCardId}.jpg`,
					premium: capitalizeFirstLetter(premium),
					level: level,
					levelText: level === 31 ? 'Max level' : `Level ${level}`,
					attack: attack,
					health: health,
					frameUrl: this.buildHeroFrame(getHeroRole(refMercCard.mercenaryRole), premium),
					equipments: refMerc.equipments.map((refEquip, index) => {
						const currentEquipmentLevel = equipmentLevels[index];
						const currentRefEquip =
							refEquip.tiers.find((tier) => tier.tier === currentEquipmentLevel) ??
							refEquip.tiers[refEquip.tiers.length - 1];
						const cardId = this.allCards.getCardFromDbfId(currentRefEquip.cardDbfId).id;
						return {
							cardId: cardId,
							tier: currentRefEquip.tier,
							imageUrl: this.i18n.getCardImage(cardId, { isHighRes: true }),
						};
					}),
					abilities: refMerc.abilities.map((refAbility, index) => {
						const currentAbilityLevel = abilityLevels[index];
						const currentRefAbility =
							refAbility.tiers.find((tier) => tier.tier === currentAbilityLevel) ??
							refAbility.tiers[refAbility.tiers.length - 1];
						const cardId = this.allCards.getCardFromDbfId(currentRefAbility.cardDbfId).id;
						return {
							cardId: cardId,
							tier: currentRefAbility.tier,
							imageUrl: this.i18n.getCardImage(cardId, { isHighRes: true }),
						};
					}),
					bounties: finalBounties,
					tasks: tasks,
				};
			}),
		);
	}

	buildHeroFrame(role: string, premium: 'normal' | 'golden' | 'diamond'): string {
		switch (premium) {
			case 'golden':
				return `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_golden_${role}.png`;
			case 'diamond':
				return `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_diamond_${role}.png`;
			case 'normal':
			default:
				return `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_${role}.png`;
		}
	}

	incrementPremium() {
		const newValue =
			this.premium.value === 'normal' ? 'golden' : this.premium.value === 'golden' ? 'diamond' : 'normal';
		this.premium.next(newValue);
	}

	decrementPremium() {
		const newValue =
			this.premium.value === 'normal' ? 'diamond' : this.premium.value === 'golden' ? 'normal' : 'golden';
		this.premium.next(newValue);
	}

	incrementSkin() {
		this.skinIndex.next(this.skinIndex.value + 1);
	}

	decrementSkin() {
		this.skinIndex.next(this.skinIndex.value - 1);
	}

	incrementLevel() {
		this.level.next(Math.min(31, this.level.value + 1));
	}

	decrementLevel() {
		this.level.next(Math.max(1, this.level.value - 1));
	}

	incrementEquipmentLevel(equipmentIndex: number) {
		const currentLevels = [...this.equipmentLevels.value];
		const currentLevel = currentLevels[equipmentIndex];
		currentLevels[equipmentIndex] = Math.min(4, currentLevel + 1);
		this.equipmentLevels.next(currentLevels);
	}

	decrementEquipmentLevel(equipmentIndex: number) {
		const currentLevels = [...this.equipmentLevels.value];
		const currentLevel = currentLevels[equipmentIndex];
		currentLevels[equipmentIndex] = Math.max(0, currentLevel - 1);
		this.equipmentLevels.next(currentLevels);
	}

	incrementAbilityLevel(abilityIndex: number) {
		const currentLevels = [...this.abilityLevels.value];
		const currentLevel = currentLevels[abilityIndex];
		currentLevels[abilityIndex] = Math.min(4, currentLevel + 1);
		this.abilityLevels.next(currentLevels);
	}

	decrementAbilityLevel(abilityIndex: number) {
		console.debug('decrementing ability level', abilityIndex);
		const currentLevels = [...this.abilityLevels.value];
		const currentLevel = currentLevels[abilityIndex];
		currentLevels[abilityIndex] = Math.max(0, currentLevel - 1);
		this.abilityLevels.next(currentLevels);
	}
}

interface Merc {
	cardId: string;
	premium: string;
	portraitUrl: string;
	frameUrl: string;
	level: number;
	levelText: string;
	attack: number;
	health: number;
	equipments: readonly Equip[];
	abilities: readonly Ability[];
	bounties: readonly BountyForMercInternal[];
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

interface BountyForMercInternal {
	readonly bountySetName: string;
	readonly bountyNames: readonly string[];
	readonly sortOrder: number;
}
