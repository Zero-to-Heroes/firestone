import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ArenaClassStat, ArenaClassStats } from '@firestone-hs/arena-stats';
import { ALL_CLASSES } from '@firestone-hs/reference-data';
import { buildColor } from '@firestone/constructed/view';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';

const WINRATE_GOOD_COLOR = 'hsl(112, 100%, 64%)';
const WINRATE_BAD_COLOR = 'hsl(0, 100%, 64%)';
const WINRATE_MAX_GOOD = 0.6;
const WINRATE_MIN_BAD = 0.4;

interface MatrixCell {
	readonly hasData: boolean;
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

@Component({
	standalone: false,
	selector: 'arena-class-stats-matrix',
	styleUrls: [`./arena-class-stats-matrix.component.scss`],
	template: `
		<div class="arena-class-stats-matrix" *ngIf="rows.length">
			<div class="header-row">
				<div class="cell row-header"></div>
				<div
					class="cell column-header"
					*ngFor="let col of columns; trackBy: trackByCol"
					[ngClass]="{ global: col.isGlobal }"
					[helpTooltip]="col.tooltip"
				>
					<img class="hero-power-icon" *ngIf="col.icon" [src]="col.icon" />
					<span class="global-label" *ngIf="col.isGlobal">{{ globalLabel }}</span>
				</div>
				<div class="cell column-header global" [helpTooltip]="globalRowTooltip">
					<span class="global-label">{{ globalLabel }}</span>
				</div>
			</div>
			<div class="body" scrollable>
				<div
					class="data-row"
					*ngFor="let row of rows; trackBy: trackByRow"
					[ngClass]="{ global: row.isGlobal }"
				>
					<div
						class="cell row-header"
						[ngClass]="{ global: row.isGlobal }"
						[helpTooltip]="row.label"
					>
						<img class="class-icon" *ngIf="row.icon" [src]="row.icon" />
						<span class="row-label" *ngIf="row.isGlobal">{{ row.label }}</span>
					</div>
					<div
						class="cell value"
						*ngFor="let cell of row.cells; let i = index"
						[ngClass]="{ empty: !cell.hasData }"
						[style.color]="cell.color"
						[helpTooltip]="cell.tooltip"
					>
						{{ cell.winrateStr }}
					</div>
					<div
						class="cell value global"
						[ngClass]="{ empty: !row.globalCell.hasData }"
						[style.color]="row.globalCell.color"
						[helpTooltip]="row.globalCell.tooltip"
					>
						{{ row.globalCell.winrateStr }}
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaClassStatsMatrixComponent {
	@Input() set stats(value: ArenaClassStats | null | undefined) {
		this._stats = value;
		this.buildMatrix();
	}

	columns: readonly MatrixColumn[] = [];
	rows: readonly MatrixRow[] = [];
	globalLabel: string;
	globalRowTooltip: string | null;

	private _stats: ArenaClassStats | null | undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		this.globalLabel = this.i18n.translateString('app.arena.class-tier-list.matrix.global') ?? 'Global';
		this.globalRowTooltip = this.i18n.translateString('app.arena.class-tier-list.matrix.global-row-tooltip');
	}

	trackByRow(index: number, row: MatrixRow) {
		return row.id;
	}

	trackByCol(index: number, col: MatrixColumn) {
		return col.id;
	}

	private buildMatrix() {
		const rawStats = this._stats?.stats;
		if (!rawStats?.length) {
			this.columns = [];
			this.rows = [];
			return;
		}

		const heroPowers = this.collectHeroPowers(rawStats);
		const classes = this.collectClasses(rawStats);

		this.columns = heroPowers.map((heroPowerId) => {
			const card = this.allCards.getCard(heroPowerId);
			return {
				id: heroPowerId,
				isGlobal: false,
				icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${heroPowerId}.jpg`,
				tooltip: card.name ?? heroPowerId,
			};
		});

		const rows: MatrixRow[] = classes.map((playerClass) => {
			const cells = heroPowers.map((heroPowerId) =>
				this.buildCell(rawStats, (s) => this.matchesClass(s, playerClass) && s.playerHeroPower === heroPowerId),
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
			this.buildCell(rawStats, (s) => s.playerHeroPower === heroPowerId),
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

		this.rows = [...rows, globalRow];
	}

	private collectHeroPowers(stats: readonly ArenaClassStat[]): readonly string[] {
		const heroPowers = new Set<string>();
		for (const stat of stats) {
			if (stat.playerHeroPower) {
				heroPowers.add(stat.playerHeroPower);
			}
		}
		return Array.from(heroPowers).sort((a, b) => {
			const nameA = this.allCards.getCard(a)?.name ?? a;
			const nameB = this.allCards.getCard(b)?.name ?? b;
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

	private buildCell(
		stats: readonly ArenaClassStat[],
		predicate: (stat: ArenaClassStat) => boolean,
	): MatrixCell {
		const matching = stats.filter(predicate);
		const totalGames = matching.reduce((acc, curr) => acc + (curr.totalGames ?? 0), 0);
		const totalWins = matching.reduce((acc, curr) => acc + (curr.totalsWins ?? 0), 0);
		if (!totalGames) {
			return {
				hasData: false,
				winrateStr: '-',
				color: null,
				tooltip: null,
			};
		}
		const winrate = totalWins / totalGames;
		const winratePct = 100 * winrate;
		return {
			hasData: true,
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
