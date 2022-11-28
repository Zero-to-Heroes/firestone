import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardRarity } from '@firestone-hs/reference-data';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { FeatureFlags } from '../../../services/feature-flags';
import { MercenariesViewMercDetailsEvent } from '../../../services/mainwindow/store/events/mercenaries/mercenaries-view-merc-details-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { deepEqual } from '../../../services/utils';
import { PersonalHeroStat } from './mercenaries-personal-hero-stats.component';

@Component({
	selector: 'mercenaries-personal-hero-stat',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-personal-hero-stat.component.scss`,
	],
	template: `
		<div
			class="mercenaries-personal-hero-stat"
			[ngClass]="{ missing: !owned, 'fully-upgraded': fullyUpgraded }"
			(click)="select()"
		>
			<div class="rarity-level">
				<img class="rarity" [src]="rarityImg" />
				<div class="level">
					<span>{{ level }}</span>
				</div>
			</div>

			<div class="portrait" [cardTooltip]="cardId">
				<img class="icon" [src]="portraitUrl" />
				<img class="frame" [src]="frameUrl" />
			</div>

			<div class="name" [helpTooltip]="name">{{ name }}</div>

			<div class="xp">
				<progress-bar
					[current]="xpInCurrentLevel"
					[total]="xpNeededForLevel"
					[fullTotalLabel]="'mercenaries.hero-stats.max-level' | owTranslate"
					[fullTotalTooltip]="fullTotalTooltip"
				></progress-bar>
			</div>

			<div class="coins left">
				<div class="coin-container">
					<img class="icon" [src]="portraitUrl" />
					<img
						class="frame"
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_coin_empty.png"
					/>
					<div class="amount">{{ totalCoinsLeft }}</div>
				</div>
			</div>

			<div
				class="coins needed"
				[helpTooltip]="coinsNeededTooltip"
				helpTooltipClasses="mercenaries-personal-hero-stat-coins-needed-tooltip"
			>
				<div class="coin-container">
					<img class="icon" [src]="portraitUrl" />
					<img
						class="frame"
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_coin_empty.png"
					/>
					<div class="amount">{{ totalCoinsNeeded }}</div>
				</div>
			</div>

			<div
				class="coins to-farm"
				[helpTooltip]="coinsToFarmTooltip"
				helpTooltipClasses="mercenaries-personal-hero-stat-coins-needed-tooltip"
			>
				<div class="coin-container">
					<img class="icon" [src]="portraitUrl" />
					<img
						class="frame"
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_coin_empty.png"
					/>
					<div class="amount">{{ totalCoinsToFarm }}</div>
				</div>
			</div>

			<div
				class="current-task"
				[helpTooltip]="currentTaskTooltip"
				helpTooltipClasses="mercenaries-personal-hero-stat-task-tooltip"
			>
				{{ currentTaskLabel }}
			</div>

			<div class="abilities">
				<div class="item" *ngFor="let ability of abilities" [ngClass]="{ missing: !ability.owned }">
					<div class="item-icon" [cardTooltip]="ability.cardId" [cardTooltipShowRelatedCards]="true">
						<img class="ability-icon" [src]="ability.artUrl" />
						<img
							class="frame"
							src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_ability_frame.png"
						/>
						<div class="speed" *ngIf="ability.speed !== null">
							<div class="value">{{ ability.speed }}</div>
						</div>
						<div class="cooldown" *ngIf="!!ability.cooldown">
							<img
								class="cooldown-icon"
								src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_cooldown.png"
							/>
							<div class="value">{{ ability.cooldown }}</div>
						</div>
					</div>
					<div class="tier" *ngIf="ability.tier">
						<div class="value">{{ ability.tier }}</div>
					</div>
				</div>
			</div>

			<div class="equipments">
				<div
					class="item"
					*ngFor="let equipment of equipments"
					[ngClass]="{ equipped: equipment.equipped, missing: !equipment.owned }"
				>
					<div class="item-icon" [cardTooltip]="equipment.cardId" [cardTooltipShowRelatedCards]="true">
						<img class="equipment-icon" [src]="equipment.artUrl" />
						<img
							class="frame"
							src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_equipment_frame.png"
						/>
					</div>
					<div class="tier" *ngIf="equipment.tier">
						<div class="value">{{ equipment.tier }}</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesPersonalHeroStatComponent {
	@Input() set stat(value: PersonalHeroStat) {
		if (deepEqual(this._stat, value)) {
			return;
		}
		console.debug('setting stat', value.name, value);
		this._stat = value;
		this.cardId = value.cardId;
		this.mercenaryId = value.mercenaryId;
		this.owned = value.owned;
		this.fullyUpgraded = value.isFullyUpgraded;

		this.rarityImg = `assets/images/rarity/rarity-${CardRarity[value.rarity]?.toLowerCase()}.png`;
		this.level = value.currentLevel;

		this.portraitUrl = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardId}.jpg`;
		this.frameUrl = buildHeroFrame(value.role, value.premium);

		this.name = value.name;

		this.xpInCurrentLevel = value.xpInCurrentLevel;
		this.xpNeededForLevel = value.xpNeededForLevel + value.xpInCurrentLevel;
		this.fullTotalTooltip = this.i18n.translateString('mercenaries.hero-stats.xp-tooltip', {
			value: value.totalXp.toLocaleString(this.i18n.formatCurrentLocale()),
		});

		this.totalCoinsLeft = value.totalCoinsLeft;
		this.totalCoinsNeeded = value.totalCoinsNeeded;
		this.totalCoinsToFarm = value.totalCoinsToFarm;

		this.currentTaskLabel = '???';
		this.currentTaskTooltip = this.i18n.translateString('mercenaries.hero-stats.current-task-tooltip');
		if (value.currentTask != null) {
			if (value.currentTask >= value.totalTasks) {
				this.currentTaskLabel = this.i18n.translateString('mercenaries.hero-stats.maxed');
				this.currentTaskTooltip = null;
			} else {
				this.currentTaskLabel = `${value.currentTask}/${value.totalTasks}`;
				this.currentTaskTooltip = value.currentTaskDescription;
			}
		}
		this.coinsNeededTooltip = this.buildCoinsNeededTooltip(value);
		this.coinsToFarmTooltip = this.buildCoinsToFarmTooltip(value, this.totalCoinsToFarm);

		this.abilities = [];
		this.equipments = [];
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}

		setTimeout(() => {
			this.abilities = value.abilities.map((info) => {
				return {
					cardId: info.cardId,
					owned: info.owned,
					speed: info.speed,
					cooldown: info.cooldown,
					tier: info.tier,
					artUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.cardId}.jpg`,
				};
			});
			this.equipments = value.equipments.map((info) => {
				return {
					cardId: info.cardId,
					owned: info.owned,
					equipped: info.isEquipped,
					tier: info.tier,
					artUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.cardId}.jpg`,
				};
			});
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr?.detectChanges();
			}
		});
	}

	cardId: string;
	owned: boolean;
	fullyUpgraded: boolean;
	name: string;
	role: string;
	level: number;
	rarityImg: string;
	portraitUrl: string;
	frameUrl: string;

	xpInCurrentLevel: number;
	xpNeededForLevel: number;
	fullTotalTooltip: string;

	totalCoinsLeft: number;
	totalCoinsNeeded: number;
	totalCoinsToFarm: number;

	currentTaskLabel: string;
	currentTaskTooltip: string;

	coinsNeededTooltip: string;
	coinsToFarmTooltip: string;

	abilities: readonly VisualAbility[];
	equipments: readonly VisualEquipment[];

	private mercenaryId: number;
	private _stat: PersonalHeroStat;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly store: AppUiStoreFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	buildPercents(value: number): string {
		return value == null ? '-' : value.toFixed(1) + '%';
	}

	buildValue(value: number, decimal = 2): string {
		return value == null ? '-' : value === 0 ? '0' : value.toFixed(decimal);
	}

	select() {
		if (FeatureFlags.ENABLE_DETAILED_MERC) {
			this.store.send(new MercenariesViewMercDetailsEvent(this.mercenaryId));
		}
	}

	private buildCoinsNeededTooltip(value: PersonalHeroStat): string {
		if (!value.bountiesWithRewards?.length) {
			return '';
		}

		const bounties: readonly string[] = value.bountiesWithRewards.map(
			(bounty) => `
				<div class="bounty">
					<div class="bounty-zone" style="white-space: nowrap;">${bounty.bountySetName}</div>
					<div class="bounty-name" style="white-space: nowrap; overflow: hidden;">${bounty.bountyName}</div>
				</div>
			`,
		);
		return `
			<div class="container">
				<div class="header"> ${this.i18n.translateString('mercenaries.hero-stats.bounties-to-farm')} </div>
				${bounties.join('')}
			</div>
		`;
	}

	private buildCoinsToFarmTooltip(value: PersonalHeroStat, totalCoinsToFarm: number): string {
		const message = this.i18n.translateString('mercenaries.hero-stats.coins-to-farm-tooltip', {
			value: value.coinsMissingFromTasks,
		});
		// Don't show the tooltip if the user already has enough coins to max the merc
		return !!totalCoinsToFarm
			? `
			<div class="container">
				${message}
			</div>
		`
			: null;
	}
}

export const buildHeroFrame = (role: string, premium: number): string => {
	switch (premium) {
		case 1:
			return `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_golden_${role}.png`;
		case 2:
			return `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_diamond_${role}.png`;
		case 0:
			return `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_${role}.png`;
	}
};

interface VisualAbility {
	readonly cardId: string;
	readonly owned: boolean;
	readonly speed: number;
	readonly cooldown: number;
	readonly artUrl: string;
	readonly tier: number;
}

interface VisualEquipment {
	readonly cardId: string;
	readonly owned: boolean;
	readonly equipped: boolean;
	readonly artUrl: string;
	readonly tier: number;
}
