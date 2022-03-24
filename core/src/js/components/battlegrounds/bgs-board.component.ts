import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, Input, OnDestroy } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import { CardsFacadeService } from '@services/cards-facade.service';
import { MinionStat } from '../../models/battlegrounds/post-match/minion-stat';
import { OverwolfService } from '../../services/overwolf.service';
import { BgsCardTooltipComponent } from './bgs-card-tooltip.component';
import { normalizeCardId } from './post-match/card-utils';

@Component({
	selector: 'bgs-board',
	styleUrls: [`../../../css/component/battlegrounds/bgs-board.component.scss`],
	template: `
		<div class="board-turn" *ngIf="customTitle">
			{{ customTitle }}
		</div>
		<div class="board-turn" *ngIf="!customTitle && _entities && !finalBoard && isNumber(currentTurn - boardTurn)">
			{{
				currentTurn - boardTurn === 0
					? ('battlegrounds.board.seen-just-now' | owTranslate)
					: ('battlegrounds.board.seen-turns-ago' | owTranslate: { value: currentTurn - boardTurn })
			}}
		</div>
		<div class="board-turn" *ngIf="!customTitle && _entities && finalBoard">Your final board</div>
		<div
			class="board-turn empty"
			*ngIf="!customTitle && !finalBoard && (!_entities || !boardTurn || !isNumber(currentTurn - boardTurn))"
			[owTranslate]="'battlegrounds.board.opponent-not-met'"
		></div>
		<div
			class="board-turn empty"
			*ngIf="!customTitle && _entities && _entities.length === 0 && isNumber(currentTurn - boardTurn)"
			[owTranslate]="'battlegrounds.board.last-board-empty'"
		></div>
		<ul class="board" *ngIf="_entities && _entities.length > 0">
			<div class="minion-container" *ngFor="let entity of _entities; trackBy: trackByEntity">
				<li>
					<card-on-board
						transition-group-item
						[entity]="entity"
						[isMainPlayer]="isMainPlayer"
						[isRecruitPhase]="isRecruitPhase"
						cachedComponentTooltip
						[componentType]="componentType"
						[componentInput]="entity"
						[componentTooltipPosition]="tooltipPosition"
					>
					</card-on-board>
				</li>
				<div class="minion-stats" *ngIf="_minionStats && _minionStats.length > 0">
					<div
						class="header"
						[helpTooltip]="
							showTooltipWarning(entity)
								? ('battlegrounds.board.stats-share-warning' | owTranslate)
								: null
						"
						*ngIf="!hideDamageHeader"
					>
						{{ 'battlegrounds.board.total-damage' | owTranslate }}
						<span *ngIf="showTooltipWarning(entity)">*</span>
					</div>
					<div class="values">
						<div class="damage-dealt">{{ getDamageDealt(entity) }}</div>
						<div class="damage-taken">{{ getDamageTaken(entity) }}</div>
					</div>
				</div>
			</div>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBoardComponent implements OnDestroy {
	componentType: ComponentType<any> = BgsCardTooltipComponent;

	_entities: readonly Entity[];
	_enchantmentCandidates: readonly Entity[];
	_options: readonly number[];
	_minionStats: readonly MinionStat[];

	@Input() hideDamageHeader: boolean;
	@Input() customTitle: string;
	@Input() isMainPlayer: boolean;
	@Input() debug: boolean;
	@Input() isRecruitPhase: boolean;
	@Input() currentTurn: number;
	@Input() boardTurn: number;
	@Input() finalBoard: boolean;
	@Input() tooltipPosition: 'left' | 'right' | 'top' | 'bottom' = 'right';
	// Used when the container will scroll, so we don't want to constrain the height
	@Input() useFullWidth = false;

	@Input() set minionStats(value: readonly MinionStat[]) {
		this._minionStats = value;
	}

	@Input('entities') set entities(value: readonly Entity[]) {
		this.inputEntities = value || [];
		this._entities = this.inputEntities.map((entity) => Entity.create({ ...entity } as Entity));
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	@Input('enchantmentCandidates') set enchantmentCandidates(value: readonly Entity[]) {
		this._enchantmentCandidates = value;
	}

	@Input('options') set options(value: readonly number[]) {
		this._options = value;
	}

	private inputEntities: readonly Entity[];
	private stateChangedListener: (message: any) => void;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly ow: OverwolfService,
	) {}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.ow.isOwEnabled() && this.ow.removeStateChangedListener(this.stateChangedListener);
	}

	showTooltipWarning(entity: Entity): boolean {
		return (
			this._entities
				?.map((e) => normalizeCardId(e.cardID, this.allCards))
				?.filter((cardId) => cardId === normalizeCardId(entity.cardID, this.allCards)).length > 1
		);
	}

	getDamageDealt(entity: Entity): number {
		return this._minionStats?.find((stat) => stat.cardId === normalizeCardId(entity.cardID, this.allCards))
			?.damageDealt;
	}

	getDamageTaken(entity: Entity): number {
		return this._minionStats?.find((stat) => stat.cardId === normalizeCardId(entity.cardID, this.allCards))
			?.damageTaken;
	}

	isNumber(value: number): boolean {
		return !isNaN(value);
	}

	trackByEntity(index: number, entity: Entity) {
		return entity.id;
	}

	trackByFn(index: number, item: Entity) {
		return item.id;
	}
}
