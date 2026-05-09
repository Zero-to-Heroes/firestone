import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { ArenaClassStat, ArenaClassStats } from '@firestone-hs/arena-stats';
import { ALL_CLASSES, normalizeHeroPower } from '@firestone-hs/reference-data';
import { buildColor } from '@firestone/constructed/view';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';

const WINRATE_GOOD_COLOR = 'hsl(112, 100%, 64%)';
const WINRATE_BAD_COLOR = 'hsl(0, 100%, 64%)';
const WINRATE_MAX_GOOD = 0.6;
const WINRATE_MIN_BAD = 0.4;

interface MatrixCell {
	readonly hasData: boolean;
	readonly winrate: number | null;
	readonly winrateStr: string;
	readonly color: string | null;
	readonly tooltip: string | null;
}

interface MatrixRow {
	readonly id: string;
	readonly isGlobal: boolean;
	readonly icon: string | null;
	readonly label: string;
	readonly cells: readonly MatrixCell[];
	readonly globalCell: MatrixCell;
}

interface MatrixColumn {
	readonly id: string;
	readonly isGlobal: boolean;
	readonly icon: string | null;
	readonly tooltip: string | null;
}

const GLOBAL_COLUMN_ID = '__global_col__';

type MatrixSortState =
	| { kind: 'none' }
	| { kind: 'byColumn'; columnKey: string; direction: 'desc' | 'asc' }
	| { kind: 'byRow'; rowKey: string; direction: 'desc' | 'asc' };

@Component({
	standalone: false,
	selector: 'arena-class-stats-matrix',
	styleUrls: [`./arena-class-stats-matrix.component.scss`],
	template: `
		<div class="arena-class-stats-matrix" *ngIf="baseRows.length">
			<div class="header-row">
				<div
					class="cell row-header corner"
					(click)="onCornerClick()"
					[attr.aria-label]="resetSortCornerAria"
				></div>
				<div
					class="cell column-header sortable"
					*ngFor="let colId of displayColumnIds; trackBy: trackByColId"
					[class.active-sort]="isActiveColumnSort(colId)"
					[class.global]="colId === GLOBAL_COLUMN_ID"
					[helpTooltip]="columnHeaderTooltip(colId)"
					(click)="onColumnHeaderClick(colId); $event.stopPropagation()"
				>
					<img
						class="hero-power-icon"
						*ngIf="colId !== GLOBAL_COLUMN_ID"
						[src]="heroPowerIconUrl(colId)"
					/>
					<span class="global-label" *ngIf="colId === GLOBAL_COLUMN_ID">{{ globalLabel }}</span>
				</div>
			</div>
			<div class="body" scrollable>
				<div
					class="data-row"
					*ngFor="let row of displayRows; trackBy: trackByRow"
					[ngClass]="{ global: row.isGlobal }"
				>
					<div
						class="cell row-header sortable"
						[class.active-sort]="isActiveRowSort(row.id)"
						[ngClass]="{ global: row.isGlobal }"
						[helpTooltip]="row.label"
						(click)="onRowHeaderClick(row.id); $event.stopPropagation()"
					>
						<img class="class-icon" *ngIf="row.icon" [src]="row.icon" />
						<span class="row-label" *ngIf="row.isGlobal">{{ row.label }}</span>
					</div>
					<div
						class="cell value"
						*ngFor="let colId of displayColumnIds; trackBy: trackByColId"
						[ngClass]="{ empty: !cellAt(row, colId).hasData, global: colId === GLOBAL_COLUMN_ID }"
						[style.color]="cellAt(row, colId).color"
						[helpTooltip]="cellAt(row, colId).tooltip"
					>
						{{ cellAt(row, colId).winrateStr }}
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaClassStatsMatrixComponent {
	readonly GLOBAL_COLUMN_ID = GLOBAL_COLUMN_ID;

	@Input() set stats(value: ArenaClassStats | null | undefined) {
		this._stats = value;
		this.buildMatrix();
	}

	/** Hero-power columns only (same order as each row's `cells` array). */
	baseColumnIds: readonly string[] = [];
	baseRows: readonly MatrixRow[] = [];
	columnByHeroPowerId = new Map<string, MatrixColumn>();

	columns: readonly MatrixColumn[] = [];
	globalLabel: string;
	globalRowTooltip: string | null;
	resetSortCornerAria = '';

	sortState: MatrixSortState = { kind: 'none' };

	private _stats: ArenaClassStats | null | undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {
		this.globalLabel = this.i18n.translateString('app.arena.class-tier-list.matrix.global') ?? 'Global';
		this.globalRowTooltip = this.i18n.translateString('app.arena.class-tier-list.matrix.global-row-tooltip');
		this.resetSortCornerAria =
			this.i18n.translateString('app.arena.class-tier-list.matrix.reset-sort-corner') ?? '';
	}

	get displayColumnIds(): readonly string[] {
		const full = [...this.baseColumnIds, GLOBAL_COLUMN_ID];
		const state = this.sortState;
		if (state.kind !== 'byRow') {
			return full;
		}
		const row = this.baseRows.find((r) => r.id === state.rowKey);
		if (!row) {
			return full;
		}
		const sortedHeroPowers = sortIdsByWinrate(
			[...this.baseColumnIds],
			(colId) => this.cellWinrate(row, colId),
			state.direction,
		);
		return [...sortedHeroPowers, GLOBAL_COLUMN_ID];
	}

	get displayRows(): readonly MatrixRow[] {
		const state = this.sortState;
		if (state.kind !== 'byColumn') {
			return this.baseRows;
		}
		const dataRows = this.baseRows.filter((r) => !r.isGlobal);
		const globalRows = this.baseRows.filter((r) => r.isGlobal);
		const sortedData = sortRowsByWinrate(
			dataRows,
			(row) => this.cellWinrate(row, state.columnKey),
			state.direction,
		);
		return [...sortedData, ...globalRows];
	}

	trackByRow(index: number, row: MatrixRow) {
		return row.id;
	}

	trackByColId(index: number, colId: string) {
		return colId;
	}

	onCornerClick() {
		this.sortState = { kind: 'none' };
		this.cdr.markForCheck();
	}

	onColumnHeaderClick(columnKey: string) {
		if (this.sortState.kind === 'byColumn' && this.sortState.columnKey === columnKey) {
			this.sortState = {
				kind: 'byColumn',
				columnKey,
				direction: this.sortState.direction === 'desc' ? 'asc' : 'desc',
			};
		} else {
			this.sortState = { kind: 'byColumn', columnKey, direction: 'desc' };
		}
		this.cdr.markForCheck();
	}

	onRowHeaderClick(rowKey: string) {
		if (this.sortState.kind === 'byRow' && this.sortState.rowKey === rowKey) {
			this.sortState = {
				kind: 'byRow',
				rowKey,
				direction: this.sortState.direction === 'desc' ? 'asc' : 'desc',
			};
		} else {
			this.sortState = { kind: 'byRow', rowKey, direction: 'desc' };
		}
		this.cdr.markForCheck();
	}

	isActiveColumnSort(columnKey: string): boolean {
		return this.sortState.kind === 'byColumn' && this.sortState.columnKey === columnKey;
	}

	isActiveRowSort(rowKey: string): boolean {
		return this.sortState.kind === 'byRow' && this.sortState.rowKey === rowKey;
	}

	columnHeaderTooltip(colId: string): string | null {
		if (colId === GLOBAL_COLUMN_ID) {
			return this.globalRowTooltip;
		}
		return this.columnByHeroPowerId.get(colId)?.tooltip ?? null;
	}

	heroPowerIconUrl(colId: string): string {
		return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${colId}.jpg`;
	}

	cellAt(row: MatrixRow, columnId: string): MatrixCell {
		if (columnId === GLOBAL_COLUMN_ID) {
			return row.globalCell;
		}
		const idx = this.baseColumnIds.indexOf(columnId);
		return idx >= 0 ? row.cells[idx] : row.globalCell;
	}

	private cellWinrate(row: MatrixRow, columnId: string): number | null {
		return this.cellAt(row, columnId).winrate;
	}

	private buildMatrix() {
		const rawStats = this._stats?.stats.filter((s) => s.playerHeroPower && s.playerClass);
		if (!rawStats?.length) {
			this.baseColumnIds = [];
			this.baseRows = [];
			this.columns = [];
			this.columnByHeroPowerId.clear();
			this.sortState = { kind: 'none' };
			this.cdr.markForCheck();
			return;
		}

		const heroPowers = this.collectHeroPowers(rawStats);
		const classes = this.collectClasses(rawStats);

		this.baseColumnIds = heroPowers;

		const columns: MatrixColumn[] = heroPowers.map((heroPowerId) => {
			const card = this.allCards.getCard(heroPowerId);
			return {
				id: heroPowerId,
				isGlobal: false,
				icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${heroPowerId}.jpg`,
				tooltip: card.name ?? heroPowerId,
			};
		});
		this.columns = columns;
		this.columnByHeroPowerId = new Map(columns.map((c) => [c.id, c]));

		const rows: MatrixRow[] = classes.map((playerClass) => {
			const cells = heroPowers.map((heroPowerId) =>
				this.buildCell(
					rawStats,
					(s) =>
						this.matchesClass(s, playerClass) &&
						normalizeHeroPower(s.playerHeroPower, this.allCards.getService()) === heroPowerId,
				),
			);
			const globalCell = this.buildCell(rawStats, (s) => this.matchesClass(s, playerClass));
			return {
				id: playerClass,
				isGlobal: false,
				icon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${playerClass}.png`,
				label: this.i18n.translateString(`global.class.${playerClass}`) ?? playerClass,
				cells,
				globalCell,
			};
		});

		const globalRowCells = heroPowers.map((heroPowerId) =>
			this.buildCell(
				rawStats,
				(s) => normalizeHeroPower(s.playerHeroPower, this.allCards.getService()) === heroPowerId,
			),
		);
		const globalRowGlobalCell = this.buildCell(rawStats, () => true);
		const globalRow: MatrixRow = {
			id: '__global__',
			isGlobal: true,
			icon: null,
			label: this.globalLabel,
			cells: globalRowCells,
			globalCell: globalRowGlobalCell,
		};

		this.baseRows = [...rows, globalRow];
		this.sortState = { kind: 'none' };
		this.cdr.markForCheck();
	}

	private collectHeroPowers(stats: readonly ArenaClassStat[]): readonly string[] {
		const heroPowers = new Set<string>();
		for (const stat of stats) {
			if (stat.playerHeroPower) {
				heroPowers.add(normalizeHeroPower(stat.playerHeroPower, this.allCards.getService()));
			}
		}
		return Array.from(heroPowers).sort((a, b) => {
			const nameA = this.i18n.translateString(
				`global.class.${this.allCards.getCard(a)?.classes?.[0]?.toLowerCase()}`,
			);
			const nameB = this.i18n.translateString(
				`global.class.${this.allCards.getCard(b)?.classes?.[0]?.toLowerCase()}`,
			);
			return nameA.localeCompare(nameB);
		});
	}

	private collectClasses(stats: readonly ArenaClassStat[]): readonly string[] {
		const present = new Set<string>();
		for (const stat of stats) {
			if (stat.playerClass) {
				present.add(stat.playerClass.toLowerCase());
			}
		}
		return ALL_CLASSES.filter((c) => present.has(c.toLowerCase()));
	}

	private matchesClass(stat: ArenaClassStat, playerClass: string): boolean {
		return stat.playerClass?.toLowerCase() === playerClass.toLowerCase();
	}

	private buildCell(stats: readonly ArenaClassStat[], predicate: (stat: ArenaClassStat) => boolean): MatrixCell {
		const matching = stats.filter(predicate);
		const totalGames = matching.reduce((acc, curr) => acc + (curr.totalGames ?? 0), 0);
		const totalWins = matching.reduce((acc, curr) => acc + (curr.totalsWins ?? 0), 0);
		if (!totalGames) {
			return {
				hasData: false,
				winrate: null,
				winrateStr: '-',
				color: null,
				tooltip: null,
			};
		}
		const winrate = totalWins / totalGames;
		const winratePct = 100 * winrate;
		return {
			hasData: true,
			winrate,
			winrateStr: winratePct.toFixed(1) + '%',
			color: buildColor(WINRATE_GOOD_COLOR, WINRATE_BAD_COLOR, winrate, WINRATE_MAX_GOOD, WINRATE_MIN_BAD),
			tooltip:
				this.i18n.translateString('app.arena.class-tier-list.matrix.cell-tooltip', {
					wins: totalWins.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS'),
					games: totalGames.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS'),
				}) ?? null,
		};
	}
}

function sortRowsByWinrate(
	rows: readonly MatrixRow[],
	getWinrate: (row: MatrixRow) => number | null,
	direction: 'desc' | 'asc',
): readonly MatrixRow[] {
	return [...rows].sort((a, b) => {
		const cmp = compareNullableWinrate(getWinrate(a), getWinrate(b), direction);
		return cmp !== 0 ? cmp : a.id.localeCompare(b.id);
	});
}

function sortIdsByWinrate(
	ids: readonly string[],
	getWinrate: (id: string) => number | null,
	direction: 'desc' | 'asc',
): readonly string[] {
	return [...ids].sort((a, b) => {
		const cmp = compareNullableWinrate(getWinrate(a), getWinrate(b), direction);
		return cmp !== 0 ? cmp : a.localeCompare(b);
	});
}

/** Null / no-data winrates sort last in both directions. */
function compareNullableWinrate(a: number | null, b: number | null, direction: 'desc' | 'asc'): number {
	if (a === null && b === null) {
		return 0;
	}
	if (a === null) {
		return 1;
	}
	if (b === null) {
		return -1;
	}
	const factor = direction === 'desc' ? -1 : 1;
	return factor * (a - b);
}
