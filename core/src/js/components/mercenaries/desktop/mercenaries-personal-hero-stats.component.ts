import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { RarityTYpe } from '@firestone-hs/reference-data';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { getHeroRole, normalizeMercenariesCardId } from '../../../services/mercenaries/mercenaries-utils';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreService, cdLog } from '../../../services/ui-store/app-ui-store.service';
import { arraysEqual, sumOnArray } from '../../../services/utils';
import { MercenaryInfo } from './mercenary-info';

@Component({
	selector: 'mercenaries-personal-hero-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-personal-hero-stats.component.scss`,
	],
	template: `
		<div class="mercenaries-personal-hero-stats" *ngIf="stats$ | async as stats; else emptyState">
			<div class="header">
				<div class="level">Lvl</div>
				<div class="role">Role</div>
				<div class="name">Name</div>
				<div class="xp">Xp</div>
				<div class="coins">Coins</div>
				<div class="tasks" helpTooltip="The current task. Task 18 is the final one for all mercs">Task</div>
				<div class="abilities">Abilities</div>
				<div class="equipments">Equipments</div>
			</div>
			<div class="list" scrollable>
				<mercenaries-personal-hero-stat
					*ngFor="let stat of stats; trackBy: trackByFn"
					[stat]="stat"
				></mercenaries-personal-hero-stat>
			</div>
		</div>
		<ng-template #emptyState>
			<mercenaries-empty-state
				[subtitle]="'Go to the Mercenaries Village screen in Hearthstone to refresh the information'"
			></mercenaries-empty-state
		></ng-template>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesPersonalHeroStatsComponent {
	stats$: Observable<readonly PersonalHeroStat[]>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreService,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		this.stats$ = this.store
			.listen$(
				([main, nav]) => main.mercenaries.referenceData,
				([main, nav]) => main.mercenaries.collectionInfo,
				([main, nav]) => main.stats.gameStats,
				([main, nav]) => nav.navigationMercenaries.heroSearchString,
				([main, nav, prefs]) => prefs.mercenariesActiveRoleFilter,
			)
			.pipe(
				filter(
					([referenceData, collectionInfo, gameStats, heroSearchString, roleFilter]) =>
						!!referenceData && !!collectionInfo,
				),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				tap((info) => console.debug('hop', info)),
				map(([referenceData, collectionInfo, gameStats, heroSearchString, roleFilter]) => {
					return collectionInfo.Mercenaries.map((memMerc) => {
						const refMerc = referenceData.mercenaries.find((m) => m.id === memMerc.Id);
						const mercenaryCard = this.allCards.getCardFromDbfId(refMerc.cardDbfId);
						return {
							mercenaryId: refMerc.id,
							owned: memMerc.Owned,
							cardId: mercenaryCard.id,
							premium: memMerc.Premium,
							rarity: memMerc.Rarity,
							name: mercenaryCard.name,
							role: getHeroRole(mercenaryCard.mercenaryRole),
							currentLevel: memMerc.Level,
							totalXp: memMerc.Experience,
							xpNeededForLevel:
								memMerc.Level === 30
									? null
									: referenceData.mercenaryLevels.find(
											(info) => info.currentLevel === memMerc.Level + 1,
									  )?.xpToNext - memMerc.Experience,
							xpInCurrentLevel:
								memMerc.Level <= 1
									? memMerc.Experience
									: memMerc.Experience -
									  referenceData.mercenaryLevels.find((info) => info.currentLevel === memMerc.Level)
											?.xpToNext,
							abilities: refMerc.abilities.map((info) => {
								const abilityCard = this.allCards.getCardFromDbfId(info.cardDbfId);
								const memAbility = memMerc.Abilities.find(
									(a) =>
										normalizeMercenariesCardId(a.CardId) ===
										normalizeMercenariesCardId(abilityCard.id),
								);
								const memAbilityCard = this.allCards.getCard(memAbility?.CardId);
								console.debug(refMerc.name, memAbilityCard?.id, abilityCard.id);
								return {
									cardId: memAbilityCard.id ?? abilityCard.id,
									owned: !!memAbility,
									speed: memAbilityCard.cost ?? abilityCard.cost,
									cooldown:
										memAbilityCard.mercenaryAbilityCooldown ?? abilityCard.mercenaryAbilityCooldown,
								};
							}),
							equipments: refMerc.equipments.map((info) => {
								const equipmentCard = this.allCards.getCardFromDbfId(info.cardDbfId);
								const memEquip = memMerc.Equipments.find((e) => e.Id === info.equipmentId);
								return {
									cardId: equipmentCard.id,
									owned: !!memEquip?.Owned,
									isEquipped: !!memEquip ? memEquip.Equipped : false,
								};
							}),
							minCostOfNextUpgrade: null,
							totalCoinsForFullUpgrade:
								sumOnArray(refMerc.abilities, (ability) =>
									sumOnArray(ability.tiers, (tier) => tier.coinCraftCost),
								) +
								sumOnArray(refMerc.equipments, (equipment) =>
									sumOnArray(equipment.tiers, (tier) => tier.coinCraftCost),
								),
							totalCoinsLeft: memMerc.CurrencyAmount,
							totalTasks: 0,
							nextTaskToComplete: 0,
						} as PersonalHeroStat;
					}).sort((a, b) => (a.name < b.name ? -1 : 1));
				}),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((info) => cdLog('emitting stats in ', this.constructor.name, info)),
			);
	}

	trackByFn(index: number, item: MercenaryInfo) {
		return item.id;
	}
}

export interface PersonalHeroStat {
	readonly mercenaryId: number;
	readonly cardId: string;
	readonly owned: boolean;
	readonly premium: number;
	readonly name: string;
	readonly rarity: RarityTYpe;
	readonly role: string;
	readonly currentLevel: number;
	readonly totalXp: number;
	readonly xpNeededForLevel: number;
	readonly xpInCurrentLevel: number;
	readonly totalCoinsLeft: number;
	readonly totalCoinsForFullUpgrade: number;
	readonly minCostOfNextUpgrade: number;
	readonly abilities: readonly PersonalHeroStatAbility[];
	readonly equipments: readonly PersonalHeroStatEquipment[];
	readonly totalTasks: number;
	readonly nextTaskToComplete: number;
}

export interface PersonalHeroStatAbility {
	readonly cardId: string;
	readonly owned: boolean;
	readonly speed: number;
	readonly cooldown: number;
}

export interface PersonalHeroStatEquipment {
	readonly cardId: string;
	readonly owned: boolean;
	readonly isEquipped: boolean;
}
