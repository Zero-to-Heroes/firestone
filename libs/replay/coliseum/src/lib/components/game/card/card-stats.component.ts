import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';

@Component({
	selector: 'card-stats',
	styleUrls: ['../../../text.scss', './card-stats.component.scss', './card-stats-colors.scss'],
	template: `
		<div class="card-stats" *ngIf="hasStats" cardElementResize [fontSizeRatio]="0.2">
			<div class="stat {{ attackClass }}">
				<img class="stat-icon" src="https://static.zerotoheroes.com/hearthstone/asset/manastorm/attack.png" />
				<div class="stat-value" resizeTarget>
					<span>{{ _attack }}</span>
				</div>
			</div>
			<div class="stat {{ healthClass }}">
				<img
					class="stat-icon"
					src="https://static.zerotoheroes.com/hearthstone/asset/manastorm/health_new.png"
				/>
				<div class="stat-value" resizeTarget>
					<span>{{ healthLeft }}</span>
				</div>
			</div>
			<div class="stat armor">
				<span resizeTarget>{{ _armor }}</span>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardStatsComponent {
	hasStats: boolean;

	attackClass: string | undefined;
	healthClass: string | undefined;
	healthLeft: number;

	_attack: number;
	_armor: number;

	private _cardId: string;
	private _health: number;
	private _damage: number;
	private _durability: number;

	constructor(private cards: AllCardsService) {}

	@Input() set cardId(cardId: string) {
		console.debug('[card-stats] setting cardId', cardId);
		this._cardId = cardId;
		this.updateStats();
	}

	@Input() set attack(attack: number) {
		console.debug('[card-stats] setting attack', attack);
		this._attack = attack;
		this.updateStats();
	}

	@Input() set health(health: number) {
		console.debug('[card-stats] setting health', health);
		this._health = health;
		this.updateStats();
	}

	@Input() set damage(damage: number) {
		console.debug('[card-stats] setting damage', damage);
		this._damage = damage;
		this.updateStats();
	}

	@Input() set durability(durability: number) {
		console.debug('[card-stats] setting durability', durability);
		this._durability = durability;
		this.updateStats();
	}

	@Input() set armor(armor: number) {
		console.debug('[card-stats] setting armor', armor);
		this._armor = armor;
		this.updateStats();
	}

	private updateStats() {
		this.attackClass = undefined;
		this.healthClass = undefined;
		this.hasStats = false;

		if (!this._cardId) {
			return;
		}
		const originalCard = this.cards.getCard(this._cardId);

		if (this._attack == null) {
			this._attack = originalCard.attack ?? 0;
		}
		if (this._health == null) {
			this._health = originalCard.health ?? 0;
		}
		if (this._damage == null) {
			this._damage = 0;
		}
		if (this._durability == null) {
			this._durability = originalCard.durability ?? 0;
		}
		if (this._armor == null) {
			this._armor = originalCard.armor ?? 0;
		}
		this.hasStats =
			(originalCard.attack ?? 0) > 0 ||
			(originalCard.health ?? 0) > 0 ||
			(originalCard.durability ?? 0) > 0 ||
			(originalCard.armor ?? 0) > 0;

		this.healthLeft = (this._health || this._durability) - this._damage;
		this.updateAttackClass(originalCard);
		this.updateHealthClass(originalCard);
	}

	private updateAttackClass(originalCard) {
		this.attackClass = 'attack';
		if (this._attack > originalCard.attack) {
			this.attackClass += ' buff';
		} else if (this._attack < originalCard.attack) {
			this.attackClass += ' debuff';
		}
	}

	private updateHealthClass(originalCard) {
		this.healthClass = 'health';
		if (this.healthLeft > originalCard.health) {
			this.healthClass += ' buff';
		} else if (this.healthLeft < originalCard.health) {
			this.healthClass += ' damaged';
		}
	}
}
