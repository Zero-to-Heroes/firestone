import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, tap } from 'rxjs/operators';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { MercenariesHeroLevelFilterType } from '../../../models/mercenaries/mercenaries-hero-level-filter.type';
import { MercenariesModeFilterType } from '../../../models/mercenaries/mercenaries-mode-filter.type';
import { MercenariesPveDifficultyFilterType } from '../../../models/mercenaries/mercenaries-pve-difficulty-filter.type';
import { MercenariesPvpMmrFilterType } from '../../../models/mercenaries/mercenaries-pvp-mmr-filter.type';
import { MercenariesStarterFilterType } from '../../../models/mercenaries/mercenaries-starter-filter.type';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import {
	MercenariesGlobalStats,
	MercenariesHeroStat,
	MercenariesReferenceData,
} from '../../../services/mercenaries/mercenaries-state-builder.service';
import { getHeroRole, normalizeMercenariesCardId } from '../../../services/mercenaries/mercenaries-utils';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreService, cdLog } from '../../../services/ui-store/app-ui-store.service';
import { filterMercenariesHeroStats, filterMercenariesRuns } from '../../../services/ui-store/mercenaries-ui-helper';
import { arraysEqual, groupByFunction, sumOnArray } from '../../../services/utils';
import { MercenaryAbility, MercenaryEquipment, MercenaryInfo } from './mercenary-info';

@Component({
	selector: 'mercenaries-hero-details',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-hero-details.component.scss`,
	],
	template: `
		<div class="mercenaries-hero-details" *ngIf="heroStats$ | async as stats">
			<div class="player-overview">
				<div class="background-additions">
					<div class="top"></div>
					<div class="bottom"></div>
				</div>
				<div class="portrait" [cardTooltip]="stats.id">
					<img class="icon" [src]="buildPortraitArtUrl(stats.id)" />
					<img class="frame" [src]="buildPortraitFrameUrl(stats.role)" />
				</div>
				<div class="player-info">
					<div class="hero-detailed-stats">
						<!-- <div class="title">General stats</div> -->
						<div class="content">
							<div class="stat">
								<div class="header">Games played</div>
								<div class="values">
									<div class="my-value">{{ stats.playerTotalMatches }}</div>
								</div>
							</div>
							<div class="stat">
								<div class="header">Winrate</div>
								<div class="values">
									<div
										class="my-value percent"
										[ngClass]="{
											'positive': stats.playerWinrate && stats.playerWinrate > 50,
											'negative': stats.playerWinrate && stats.playerWinrate < 50
										}"
									>
										{{ buildValuePercent(stats.playerWinrate, 0) }}
									</div>
									<bgs-global-value
										[value]="buildValuePercent(stats.globalWinrate)"
									></bgs-global-value>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="equipment-overview">
				<div class="equipment-header">Equipments</div>
				<div class="equipment-content">
					<div class="equipment-item" *ngFor="let equipment of stats.equipment">
						<div class="equipment-item-icon" [cardTooltip]="equipment.cardId">
							<img class="icon" [src]="buildEquipmentArtUrl(equipment.cardId)" />
							<img
								class="frame"
								src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_equipment_frame.png?v=3"
							/>
						</div>
						<!-- <div class="equipment-item-name">{{ equipment.name }}</div> -->
						<div class="equipment-item-stats">
							<div class="item winrate">
								<div class="label">Global winrate</div>
								<div class="values">
									<div class="value player">{{ buildValuePercent(equipment.globalWinrate) }}</div>
								</div>
							</div>
							<div class="item winrate">
								<div class="label">Your winrate</div>
								<div class="values">
									<div class="value player">
										{{
											equipment.playerWinrate != null
												? buildValuePercent(equipment.playerWinrate)
												: '--'
										}}
									</div>
								</div>
							</div>
							<div class="stats">
								<div class="item popularity">
									<div class="label">Games played</div>
									<div class="values">
										<div class="value player">{{ buildValue(equipment.playerGamesPlayed, 0) }}</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="abilities-overview">
				<div class="ability-header">Abilities</div>
				<div class="ability-content">
					<div class="ability-item" *ngFor="let ability of stats.abilities">
						<div class="ability-item-icon" [cardTooltip]="ability.cardId" cardTooltipPosition="top-right">
							<img class="icon" [src]="buildAbilityArtUrl(ability.cardId)" />
							<img
								class="frame"
								src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_ability_frame.png?v=4"
							/>
							<div class="speed">
								<div class="value">{{ ability.speed }}</div>
							</div>
							<div class="cooldown" *ngIf="!!ability.cooldown">
								<img
									class="cooldown-icon"
									src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_cooldown.png?v=3"
								/>
								<div class="value">{{ ability.cooldown }}</div>
							</div>
						</div>
						<!-- <div class="equipment-item-name">{{ equipment.name }}</div> -->
						<div class="ability-item-stats">
							<div class="item winrate">
								<div
									class="label"
									helpTooltip="How many times each ability is used per time by the community"
								>
									Global usage
								</div>
								<div class="values">
									<div class="value player">{{ buildValue(ability.globalUsePerMatch, 2) }}</div>
								</div>
							</div>
							<div class="item winrate">
								<div class="label" helpTooltip="How many times each ability is used per time by you">
									Your usage
								</div>
								<div class="values">
									<div class="value player">
										{{
											ability.playerUsePerMatch != null
												? buildValuePercent(ability.playerUsePerMatch)
												: '--'
										}}
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
export class MercenariesHeroDetailsComponent {
	heroStats$: Observable<MercenaryInfo>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreService,
		private readonly allCards: CardsFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {
		this.heroStats$ = this.store
			.listen$(
				([main, nav]) => main.mercenaries.globalStats,
				([main, nav]) => main.mercenaries.referenceData,
				([main, nav]) => main.stats.gameStats,
				([main, nav, prefs]) => nav.navigationMercenaries.selectedHeroId,
				([main, nav, prefs]) => prefs.mercenariesActiveModeFilter,
				([main, nav, prefs]) => prefs.mercenariesActivePveDifficultyFilter,
				([main, nav, prefs]) => prefs.mercenariesActivePvpMmrFilter,
				([main, nav, prefs]) => prefs.mercenariesActiveStarterFilter,
				([main, nav, prefs]) => prefs.mercenariesActiveHeroLevelFilter,
			)
			.pipe(
				map(
					([
						globalStats,
						referenceData,
						gameStats,
						selectedHeroId,
						modeFilter,
						difficultyFilter,
						mmrFilter,
						starterFilter,
						levelFilter,
					]) =>
						[
							globalStats,
							referenceData,
							modeFilter === 'pve'
								? gameStats.stats.filter((stat) => (stat.gameMode as any) === 'mercenaries')
								: gameStats.stats.filter((stat) => (stat.gameMode as any) === 'mercenaries-pvp'),
							selectedHeroId,
							modeFilter,
							difficultyFilter,
							mmrFilter,
							starterFilter,
							levelFilter,
						] as [
							MercenariesGlobalStats,
							MercenariesReferenceData,
							readonly GameStat[],
							string,
							MercenariesModeFilterType,
							MercenariesPveDifficultyFilterType,
							MercenariesPvpMmrFilterType,
							MercenariesStarterFilterType,
							MercenariesHeroLevelFilterType,
						],
				),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(
					([
						globalStats,
						referenceData,
						gameStats,
						heroCardId,
						modeFilter,
						difficultyFilter,
						mmrFilter,
						starterFilter,
						levelFilter,
					]) => {
						const infos = modeFilter === 'pve' ? globalStats?.pve : globalStats?.pvp;
						return [
							filterMercenariesHeroStats(
								infos?.heroStats?.filter((stat) => stat.heroCardId === heroCardId),
								modeFilter,
								'all',
								difficultyFilter,
								mmrFilter,
								starterFilter,
								levelFilter,
								this.allCards,
								referenceData,
							),
							filterMercenariesRuns(
								gameStats.filter(
									(stat) => normalizeMercenariesCardId(stat.playerCardId) === heroCardId,
								),
								modeFilter,
								'all',
								difficultyFilter,
								mmrFilter,
								starterFilter,
								levelFilter,
							),
							heroCardId,
							referenceData,
						] as [readonly MercenariesHeroStat[], readonly GameStat[], string, MercenariesReferenceData];
					},
				),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(([heroStats, gameStats, heroCardId, referenceData]) => {
					if (heroStats?.length) {
						const refHeroStat = heroStats[0];
						const globalTotalMatches = sumOnArray(heroStats, (stat) => stat.totalMatches);
						return {
							id: refHeroStat.heroCardId,
							name: this.allCards.getCard(refHeroStat.heroCardId)?.name ?? refHeroStat.heroCardId,
							role: refHeroStat.heroRole,
							globalTotalMatches: globalTotalMatches,
							globalWinrate:
								globalTotalMatches === 0
									? null
									: (100 * sumOnArray(heroStats, (stat) => stat.totalWins)) / globalTotalMatches,
							playerTotalMatches: gameStats?.length ?? 0,
							playerWinrate: !gameStats?.length
								? null
								: (100 * gameStats.filter((stat) => stat.result === 'won').length) / gameStats.length,
							equipment: this.buildEquipment(heroStats),
							abilities: this.buildAbilities(heroStats, referenceData),
						} as MercenaryInfo;
					} else {
						const merc = referenceData.mercenaries.find(
							(m) => this.allCards.getCardFromDbfId(m.cardDbfId).id === heroCardId,
						);
						const mercCard = this.allCards.getCardFromDbfId(merc.cardDbfId);
						return {
							id: mercCard.id,
							name: mercCard.name,
							role: getHeroRole(mercCard.mercenaryRole),
							globalTotalMatches: 0,
							globalWinrate: null,
							globalPopularity: null,
							playerTotalMatches: 0,
							playerWinrate: null,
							equipment: merc.equipments.map((equipment) => {
								const equipmentCard = this.allCards.getCardFromDbfId(equipment.cardDbfId);
								return {
									cardId: equipmentCard.id,
									name: equipmentCard.name,
									globalTotalMatches: 0,
									globalPopularity: null,
									globalWinrate: null,
									playerTotalMatches: 0,
									playerWinrate: null,
								} as MercenaryEquipment;
							}),
							abilities: merc.abilities.map((ability) => {
								const abilityCard = this.allCards.getCardFromDbfId(ability.cardDbfId);
								return {
									cardId: abilityCard.id,
									name: abilityCard.name,
									speed: abilityCard.cost,
									cooldown: abilityCard.mercenaryAbilityCooldown,
									globalTotalMatches: 0,
									globalTotalUses: 0,
									globalUsePerMatch: null,
									playerUsePerMatch: null,
								} as MercenaryAbility;
							}),
						} as MercenaryInfo;
					}
				}),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((info) => cdLog('emitting stats in ', this.constructor.name, info)),
			);
	}

	private buildAbilities(
		heroStats: readonly MercenariesHeroStat[],
		referenceData: MercenariesReferenceData,
	): readonly MercenaryAbility[] {
		console.debug('building abilities', heroStats, referenceData);
		const abilities = referenceData.mercenaries.find(
			(merc) => this.allCards.getCardFromDbfId(merc.cardDbfId).id === heroStats[0].heroCardId,
		).abilities;
		const abilityIds = abilities
			.map((ability) => ability.cardDbfId)
			.map((abilityDbfId) => this.allCards.getCardFromDbfId(abilityDbfId).id);
		// const abilityIds = getHeroAbilities(heroStats[0].heroCardId);
		return abilityIds.map((abilityId) => {
			console.debug('handling ability', abilityId);
			const globalTotalMatches = sumOnArray(heroStats, (stat) => this.getSkillTotalMatches(stat, abilityId));
			const globalTotalUses = sumOnArray(heroStats, (stat) => this.getSkillUse(stat, abilityId));
			const result = {
				cardId: abilityId,
				name: this.allCards.getCard(abilityId)?.name ?? abilityId,
				speed: this.allCards.getCard(abilityId).cost,
				cooldown: this.allCards.getCard(abilityId).mercenaryAbilityCooldown,
				globalTotalMatches: globalTotalMatches,
				globalTotalUses: globalTotalUses,
				globalUsePerMatch: globalTotalMatches === 0 ? null : globalTotalUses / globalTotalMatches,
				playerUsePerMatch: null,
			} as MercenaryAbility;
			console.debug('ability', abilityId, result, globalTotalMatches, globalTotalUses, heroStats);
			return result;
		});
	}

	private getSkillUse(stat: MercenariesHeroStat, abilityId: string): number {
		return stat.skillInfos.find((skill) => skill.cardId === abilityId)?.numberOfTimesUsed ?? 0;
	}

	private getSkillTotalMatches(stat: MercenariesHeroStat, abilityId: string): number {
		return stat.skillInfos.find((skill) => skill.cardId === abilityId)?.numberOfMatches ?? 0;
	}

	private buildEquipment(heroStats: readonly MercenariesHeroStat[]): readonly MercenaryEquipment[] {
		const groupedByEquipment = groupByFunction((stat: MercenariesHeroStat) => stat.equipementCardId)(heroStats);
		const totalMatches = sumOnArray(heroStats, (stat) => stat.totalMatches);
		return Object.keys(groupedByEquipment)
			.map((equipmentId) => {
				const stats = groupedByEquipment[equipmentId];
				const globalTotalMatches = sumOnArray(stats, (stat) => stat.totalMatches);
				console.debug('equipm', equipmentId, stats, globalTotalMatches);
				return {
					cardId: equipmentId,
					name: this.allCards.getCard(equipmentId)?.name ?? equipmentId,
					globalTotalMatches: globalTotalMatches,
					globalPopularity: totalMatches == null ? null : (100 * globalTotalMatches) / totalMatches,
					globalWinrate:
						globalTotalMatches === 0
							? null
							: (100 * sumOnArray(stats, (stat) => stat.totalWins)) / globalTotalMatches,
					playerTotalMatches: 0,
					playerWinrate: null,
				} as MercenaryEquipment;
			})
			.sort((a, b) => b.globalWinrate - a.globalWinrate);
	}

	buildPortraitArtUrl(heroId: string): string {
		return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${heroId}.jpg`;
	}

	buildPortraitFrameUrl(role: string): string {
		return `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_golden_${role}.png?v=2`;
	}

	buildEquipmentArtUrl(cardId: string): string {
		return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`;
	}

	buildAbilityArtUrl(cardId: string): string {
		return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`;
	}

	trackByFn(index: number, item: MercenaryInfo) {
		return item.id;
	}

	buildValue(value: number, decimals = 2): string {
		if (value === 100) {
			return '100';
		}
		return value == null ? '-' : value.toFixed(decimals);
	}

	buildValuePercent(value: number, decimals = 1): string {
		if (value === 100) {
			return '100%';
		}
		return value == null ? '-' : value.toFixed(decimals) + '%';
	}
}
