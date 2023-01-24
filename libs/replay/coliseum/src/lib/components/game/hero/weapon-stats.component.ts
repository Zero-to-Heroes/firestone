import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';

@Component({
	selector: 'weapon-stats',
	styleUrls: ['../../../text.scss', './weapon-stats.component.scss', '../card/card-stats-colors.scss'],
	template: `
		<div class="weapon-stats" cardElementResize [fontSizeRatio]="0.15">
			<div class="stat {{ attackClass }}" resizeTarget>
				<div class="stat-value">
					<span>{{ _attack }}</span>
				</div>
			</div>
			<div class="stat {{ durabilityClass }}" resizeTarget>
				<div class="stat-value">
					<span>{{ durabilityLeft }}</span>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeaponStatsComponent {
	attackClass: string | undefined;
	durabilityClass: string | undefined;

	durabilityLeft: number;
	_attack: number;

	private _cardId: string;
	private _durability: number;
	private _damage: number;

	constructor(private cards: AllCardsService) {}

	@Input() set cardId(cardId: string) {
		// console.debug('[weapon-stats] setting cardId', cardId);
		this._cardId = cardId;
		this.updateStats();
	}

	@Input() set attack(attack: number) {
		// console.debug('[weapon-stats] setting attack', attack);
		this._attack = attack;
		this.updateStats();
	}

	@Input() set durability(value: number) {
		// console.debug('[weapon-stats] setting health', value);
		this._durability = value;
		this.updateStats();
	}

	@Input() set damage(damage: number) {
		// console.debug('[weapon-stats] setting damage', damage);
		this._damage = damage;
		this.updateStats();
	}

	private updateStats() {
		this.attackClass = undefined;
		this.durabilityClass = undefined;

		if (!this._cardId) {
			return;
		}
		const originalCard = this.cards.getCard(this._cardId);

		if (this._attack == null) {
			this._attack = originalCard.attack ?? 0;
		}
		if (this._durability == null) {
			this._durability = originalCard.durability ?? 0;
		}
		if (this._damage == null) {
			this._damage = 0;
		}

		this.durabilityLeft = this._durability - this._damage;
		this.updateAttackClass(originalCard);
		this.updateDurabilityClass(originalCard);
	}

	private updateAttackClass(originalCard) {
		this.attackClass = 'attack';
		if (this._attack > originalCard.attack) {
			this.attackClass += ' buff';
		} else if (this._attack < originalCard.attack) {
			this.attackClass += ' debuff';
		}
	}

	private updateDurabilityClass(originalCard) {
		this.durabilityClass = 'durability';
		if (this._damage > 0) {
			this.durabilityClass += ' damaged';
		}
	}
}
