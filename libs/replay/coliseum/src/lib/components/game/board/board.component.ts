import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'board',
	styleUrls: ['./board.component.scss'],
	template: `
		<ul class="board" [transition-group]="'flip-list'">
			<li *ngFor="let entity of _entities; trackBy: trackByFn">
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
export class BoardComponent {
	_entities: readonly Entity[];
	_enchantmentCandidates: readonly Entity[];
	_options: readonly number[];

	@Input() isMainPlayer: boolean;
	@Input() isRecruitPhase: boolean;

	@Input() set entities(entities: readonly Entity[]) {
		console.debug('[board] setting new entities', entities);
		this._entities = entities;
	}

	@Input() set enchantmentCandidates(value: readonly Entity[]) {
		console.debug('[board] setting enchantmentCandidates', value);
		this._enchantmentCandidates = value;
	}

	@Input() set options(value: readonly number[]) {
		console.debug('[board] setting options', value);
		this._options = value;
	}

	isOption(entity: Entity): boolean {
		return this._options.indexOf(entity.id) !== -1;
	}

	trackByFn(index, item: Entity) {
		return item.id;
	}

	buildEnchantments(entity: Entity): readonly Entity[] {
		if (!this._enchantmentCandidates) {
			return [];
		}
		return this._enchantmentCandidates.filter((e) => e.getTag(GameTag.ATTACHED) === entity.id);
	}
}
