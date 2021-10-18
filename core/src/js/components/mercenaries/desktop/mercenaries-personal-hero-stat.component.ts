import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardRarity } from '@firestone-hs/reference-data';
import { PersonalHeroStat } from './mercenaries-personal-hero-stats.component';

@Component({
	selector: 'mercenaries-personal-hero-stat',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-personal-hero-stat.component.scss`,
	],
	template: `
		<div class="mercenaries-personal-hero-stat" [ngClass]="{ 'missing': !owned }">
			<div class="rarity-level">
				<img class="rarity" [src]="rarityImg" />
				<div class="level">
					<span>{{ level }}</span>
				</div>
			</div>

			<div class="portrait" [cardTooltip]="cardId" cardTooltipPosition="top-right">
				<img class="icon" [src]="portraitUrl" />
				<img class="frame" [src]="frameUrl" />
			</div>

			<div class="name" [helpTooltip]="name">{{ name }}</div>

			<div class="xp">
				<progress-bar [current]="xpInCurrentLevel" [total]="xpNeededForLevel"></progress-bar>
			</div>

			<div class="coins left">
				<img class="icon" [src]="portraitUrl" />
				<img
					class="frame"
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_coin_empty.png?v=5"
				/>
				<div class="amount">{{ totalCoinsLeft }}</div>
			</div>

			<div class="coins needed">
				<img class="icon" [src]="portraitUrl" />
				<img
					class="frame"
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_coin_empty.png?v=5"
				/>
				<div class="amount">{{ totalCoinsForFullUpgrade }}</div>
			</div>

			<div class="current-task" [helpTooltip]="currentTaskTooltip">
				{{ currentTaskLabel }}
			</div>

			<div class="abilities">
				<div class="item" *ngFor="let ability of abilities" [ngClass]="{ 'missing': !ability.owned }">
					<div class="item-icon" [cardTooltip]="ability.cardId" cardTooltipPosition="top-right">
						<img class="icon" [src]="ability.artUrl" />
						<img
							class="frame"
							src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_ability_frame.png?v=5"
						/>
						<div class="speed">
							<div class="value">{{ ability.speed }}</div>
						</div>
						<div class="cooldown" *ngIf="!!ability.cooldown">
							<img
								class="cooldown-icon"
								src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_cooldown.png?v=5"
							/>
							<div class="value">{{ ability.cooldown }}</div>
						</div>
					</div>
				</div>
			</div>

			<div class="equipments">
				<div
					class="item"
					*ngFor="let equipment of equipments"
					[ngClass]="{ 'equipped': equipment.equipped, 'missing': !equipment.owned }"
				>
					<div class="item-icon" [cardTooltip]="equipment.cardId" cardTooltipPosition="top-right">
						<img class="icon" [src]="equipment.artUrl" />
						<img
							class="frame"
							src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_equipment_frame.png?v=5"
						/>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesPersonalHeroStatComponent {
	@Input() set stat(value: PersonalHeroStat) {
		console.debug('setting value', value);
		this.cardId = value.cardId;
		this.owned = value.owned;

		this.rarityImg = `assets/images/rarity/rarity-${CardRarity[value.rarity]?.toLowerCase()}.png`;
		this.level = value.currentLevel;

		this.portraitUrl = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardId}.jpg`;
		this.frameUrl = this.buildHeroFrame(value.role, value.premium);

		this.name = value.name;

		this.xpInCurrentLevel = value.xpInCurrentLevel;
		this.xpNeededForLevel = value.xpNeededForLevel + value.xpInCurrentLevel;

		this.totalCoinsLeft = value.totalCoinsLeft;
		this.totalCoinsForFullUpgrade = value.totalCoinsForFullUpgrade;

		this.currentTaskLabel = '???';
		this.currentTaskTooltip =
			'The task can only be updated once a visitor for this mercenary visits your village while the app is running.';
		if (value.currentTask) {
			this.currentTaskLabel = '' + value.currentTask;
			this.currentTaskTooltip = value.currentTaskDescription;
		}

		this.abilities = value.abilities.map((info) => {
			return {
				cardId: info.cardId,
				owned: info.owned,
				speed: info.speed,
				cooldown: info.cooldown,
				artUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.cardId}.jpg`,
			};
		});
		this.equipments = value.equipments.map((info) => {
			return {
				cardId: info.cardId,
				owned: info.owned,
				equipped: info.isEquipped,
				artUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.cardId}.jpg`,
			};
		});
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}
	}

	cardId: string;
	owned: boolean;
	name: string;
	role: string;
	level: number;
	rarityImg: string;
	portraitUrl: string;
	frameUrl: string;

	xpInCurrentLevel: number;
	xpNeededForLevel: number;

	totalCoinsLeft: number;
	totalCoinsForFullUpgrade: number;

	currentTaskLabel: string;
	currentTaskTooltip: string;

	abilities: readonly VisualAbility[];
	equipments: readonly VisualEquipment[];

	constructor(private readonly cdr: ChangeDetectorRef) {}

	buildPercents(value: number): string {
		return value == null ? '-' : value.toFixed(1) + '%';
	}

	buildValue(value: number, decimal = 2): string {
		return value == null ? '-' : value === 0 ? '0' : value.toFixed(decimal);
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

interface VisualAbility {
	readonly cardId: string;
	readonly owned: boolean;
	readonly speed: number;
	readonly cooldown: number;
	readonly artUrl: string;
}

interface VisualEquipment {
	readonly cardId: string;
	readonly owned: boolean;
	readonly equipped: boolean;
	readonly artUrl: string;
}
