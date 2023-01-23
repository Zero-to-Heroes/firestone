import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'hero-power',
	styleUrls: ['./hero-power.component.scss'],
	template: `
		<div
			*ngIf="entity"
			class="hero-power"
			cardTooltip
			[tooltipEntity]="entity"
			[attr.data-entity-id]="entityId"
			[@flipState]="status"
		>
			<div class="box-side active" [ngClass]="{ highlight: _option }">
				<hero-power-art [cardId]="cardId"></hero-power-art>
				<hero-power-frame [exhausted]="false" [premium]="premium"></hero-power-frame>
				<hero-power-cost [cardId]="cardId" [cost]="cost"></hero-power-cost>
			</div>
			<div class="box-side exhausted">
				<hero-power-frame [exhausted]="true" [premium]="premium"></hero-power-frame>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('flipState', [
			state(
				'active',
				style({
					transform: 'rotateY(0)',
				}),
			),
			state(
				'exhausted',
				style({
					transform: 'rotateY(179deg)',
				}),
			),
			transition(
				'active => exhausted',
				animate(
					'600ms cubic-bezier(0.65,-0.29,0.40,1.5)',
					keyframes([
						style({ transform: 'rotateY(0)', offset: 0 }),
						style({ transform: 'rotateY(179deg)', offset: 1 }),
					]),
				),
			),
			transition(
				'exhausted => active',
				animate(
					'600ms cubic-bezier(0.65,-0.29,0.40,1.5)',
					keyframes([
						style({ transform: 'rotateY(179deg)', offset: 0 }),
						style({ transform: 'rotateY(0)', offset: 1 }),
					]),
				),
			),
		]),
	],
})
export class HeroPowerComponent {
	entity: Entity | undefined;
	entityId: number;
	cardId: string;
	cost: number;
	status: 'active' | 'exhausted';
	// exhausted: boolean;
	premium: boolean;
	_option: boolean;

	@Input() set heroPower(heroPower: Entity | undefined) {
		console.debug('[hero-power] setting new heroPower', heroPower, heroPower && heroPower.tags.toJS());
		this.entity = heroPower;
		if (!heroPower) {
			// console.log('no hero power, returning');
			return;
		}
		this.entityId = heroPower.id;
		this.cardId = heroPower.cardID;
		const exhausted =
			heroPower.getTag(GameTag.EXHAUSTED) === 1 || heroPower.getTag(GameTag.HERO_POWER_DISABLED) === 1;
		this.status = exhausted ? 'exhausted' : 'active';
		this.cost = heroPower.getTag(GameTag.COST);
		this.premium = heroPower.getTag(GameTag.PREMIUM) === 1;
	}

	@Input() set option(value: boolean) {
		this._option = value;
	}
}
