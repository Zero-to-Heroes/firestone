import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { NGXLogger } from 'ngx-logger';
import { BgsCardTooltipComponent } from './bgs-card-tooltip.component';

@Component({
	selector: 'bgs-board',
	styleUrls: [`../../../css/component/battlegrounds/bgs-board.component.scss`],
	template: `
		<div class="board-turn" *ngIf="_entities?.length">
			Board as seen
			{{ currentTurn - boardTurn === 0 ? 'just now' : currentTurn - boardTurn + ' turns ago' }}
		</div>
		<div class="board-turn empty" *ngIf="!_entities?.length">
			You have not fought that player yet
		</div>
		<ul class="board" [transition-group]="'flip-list'" *ngIf="_entities?.length">
			<li
				*ngFor="let entity of _entities; trackBy: trackByFn"
				cachedComponentTooltip
				[componentType]="componentType"
				[componentInput]="entity"
				[componentTooltipPosition]="tooltipPosition"
			>
				<card-on-board
					transition-group-item
					[entity]="entity"
					[enchantments]="buildEnchantments(entity)"
					[option]="isOption(entity)"
					[isMainPlayer]="isMainPlayer"
					[isRecruitPhase]="isRecruitPhase"
				>
				</card-on-board>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBoardComponent {
	_entities: readonly Entity[];
	_enchantmentCandidates: readonly Entity[];
	_options: readonly number[];
	componentType: ComponentType<any> = BgsCardTooltipComponent;

	constructor(private logger: NGXLogger) {}

	@Input() isMainPlayer: boolean;
	@Input() isRecruitPhase: boolean;
	@Input() currentTurn: number;
	@Input() boardTurn: number;
	@Input() tooltipPosition: 'left' | 'right' | 'top' | 'bottom' = 'right';

	@Input('entities') set entities(entities: readonly Entity[]) {
		// this.logger.debug('[board] setting new entities', entities);
		this._entities = entities;
	}

	@Input('enchantmentCandidates') set enchantmentCandidates(value: readonly Entity[]) {
		// this.logger.debug('[board] setting enchantmentCandidates', value);
		this._enchantmentCandidates = value;
	}

	@Input('options') set options(value: readonly number[]) {
		// this.logger.debug('[board] setting options', value);
		this._options = value;
	}

	isOption(entity: Entity): boolean {
		return this._options && this._options.indexOf(entity.id) !== -1;
	}

	trackByFn(index, item: Entity) {
		return item.id;
	}

	buildEnchantments(entity: Entity): readonly Entity[] {
		if (!this._enchantmentCandidates) {
			return [];
		}
		return this._enchantmentCandidates.filter(e => e.getTag(GameTag.ATTACHED) === entity.id);
	}
}
