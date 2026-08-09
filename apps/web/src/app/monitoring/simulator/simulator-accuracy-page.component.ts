import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ApiRunner } from '@firestone/shared/framework/core';
import { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

const ACCURACY_URL = 'https://static.zerotoheroes.com/api/admin/simulator/accuracy.json';
const DEFAULT_RANGE_DAYS = 30;
const ACCURACY_Y_MIN = -0.5;
/** Above this many selected days, roll up to weekly points for readability. */
const WEEKLY_AGGREGATION_DAYS = 45;
/** Above this many selected days, roll up to monthly points. */
const MONTHLY_AGGREGATION_DAYS = 180;
const DENSE_POINT_COUNT = 40;

interface SimulatorAccuracyPoint {
	readonly period: string;
	readonly version: string;
	readonly totalGames: number;
	readonly failures: number;
	readonly hsBug: number | null;
}

interface ChartPoint {
	readonly period: string;
	readonly dateLabel: string;
	readonly version: string;
	readonly totalGames: number;
	readonly failures: number;
	readonly accuracy: number;
	readonly plottedAccuracy: number;
}

type ChartResolution = 'daily' | 'weekly' | 'monthly';

@Component({
	standalone: true,
	selector: 'web-simulator-accuracy-page',
	imports: [CommonModule, FormsModule, BaseChartDirective],
	providers: [provideCharts(withDefaultRegisterables())],
	templateUrl: './simulator-accuracy-page.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimulatorAccuracyPageComponent implements OnInit {
	loading = true;
	error: string | null = null;

	minDate = '';
	maxDate = '';
	startDate = '';
	endDate = '';

	chartData: ChartData<'line'> = { labels: [], datasets: [] };
	chartOptions: ChartOptions<'line'> = this.buildChartOptions();
	resolutionNote = '';

	private allPoints: ChartPoint[] = [];
	private filteredPoints: ChartPoint[] = [];

	constructor(
		private readonly api: ApiRunner,
		private readonly title: Title,
		private readonly cdr: ChangeDetectorRef,
	) {}

	async ngOnInit(): Promise<void> {
		this.title.setTitle('BG Simulator Accuracy — Firestone');
		await this.loadData();
	}

	onStartDateChange(value: string): void {
		if (!value) {
			return;
		}
		this.startDate = value;
		if (this.endDate && this.startDate > this.endDate) {
			this.endDate = this.startDate;
		}
		this.refreshChart();
	}

	onEndDateChange(value: string): void {
		if (!value) {
			return;
		}
		this.endDate = value;
		if (this.startDate && this.startDate > this.endDate) {
			this.startDate = this.endDate;
		}
		this.refreshChart();
	}

	private async loadData(): Promise<void> {
		this.loading = true;
		this.error = null;
		this.cdr.markForCheck();

		const raw = await this.api.callGetApi<SimulatorAccuracyPoint[]>(ACCURACY_URL);
		if (!raw?.length) {
			this.loading = false;
			this.error = 'Could not load simulator accuracy data.';
			this.cdr.markForCheck();
			return;
		}

		this.allPoints = this.normalizePoints(raw);
		const periods = this.allPoints.map((p) => p.period);
		this.minDate = this.toDateInput(periods[0]);
		this.maxDate = this.toDateInput(periods[periods.length - 1]);
		this.endDate = this.maxDate;
		this.startDate = this.computeDefaultStart(this.endDate, this.minDate);

		this.loading = false;
		this.refreshChart();
	}

	private normalizePoints(raw: readonly SimulatorAccuracyPoint[]): ChartPoint[] {
		const byPeriod = new Map<string, SimulatorAccuracyPoint>();
		for (const point of raw) {
			if (!point?.period || !point.totalGames) {
				continue;
			}
			byPeriod.set(point.period, point);
		}

		return [...byPeriod.values()]
			.sort((a, b) => a.period.localeCompare(b.period))
			.map((point) => {
				const accuracy = 1 - (100 * point.failures) / point.totalGames;
				return {
					period: point.period,
					dateLabel: this.toDateInput(point.period),
					version: point.version,
					totalGames: point.totalGames,
					failures: point.failures,
					accuracy,
					plottedAccuracy: Math.max(accuracy, ACCURACY_Y_MIN),
				};
			});
	}

	private computeDefaultStart(endDate: string, minDate: string): string {
		const end = new Date(`${endDate}T00:00:00.000Z`);
		end.setUTCDate(end.getUTCDate() - (DEFAULT_RANGE_DAYS - 1));
		const candidate = this.toDateInput(end.toISOString());
		return candidate < minDate ? minDate : candidate;
	}

	private refreshChart(): void {
		const inRange = this.allPoints.filter(
			(point) => point.dateLabel >= this.startDate && point.dateLabel <= this.endDate,
		);
		const resolution = this.resolveResolution(this.startDate, this.endDate);
		this.filteredPoints = resolution === 'daily' ? inRange : this.aggregatePoints(inRange, resolution);
		this.resolutionNote = this.resolutionLabel(resolution);

		const showPoints = this.filteredPoints.length <= DENSE_POINT_COUNT;
		this.chartData = {
			labels: this.filteredPoints.map((point) => point.dateLabel),
			datasets: [
				{
					data: this.filteredPoints.map((point) => point.plottedAccuracy),
					label: 'Accuracy',
					borderColor: '#ffb948',
					backgroundColor: 'rgba(255, 185, 72, 0.18)',
					pointBackgroundColor: '#ffb948',
					pointBorderColor: '#e9cdb5',
					pointRadius: showPoints ? 3 : 0,
					pointHoverRadius: 5,
					borderWidth: 2,
					fill: true,
					tension: 0.25,
				},
			],
		};
		this.chartOptions = this.buildChartOptions();
		this.cdr.markForCheck();
	}

	private resolveResolution(startDate: string, endDate: string): ChartResolution {
		const daySpan = this.inclusiveDaySpan(startDate, endDate);
		if (daySpan > MONTHLY_AGGREGATION_DAYS) {
			return 'monthly';
		}
		if (daySpan > WEEKLY_AGGREGATION_DAYS) {
			return 'weekly';
		}
		return 'daily';
	}

	private resolutionLabel(resolution: ChartResolution): string {
		switch (resolution) {
			case 'weekly':
				return 'Showing weekly totals (selected range is longer than 45 days).';
			case 'monthly':
				return 'Showing monthly totals (selected range is longer than 180 days).';
			default:
				return 'Showing daily values.';
		}
	}

	private inclusiveDaySpan(startDate: string, endDate: string): number {
		const start = Date.parse(`${startDate}T00:00:00.000Z`);
		const end = Date.parse(`${endDate}T00:00:00.000Z`);
		if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
			return 0;
		}
		return Math.floor((end - start) / 86_400_000) + 1;
	}

	private aggregatePoints(points: readonly ChartPoint[], resolution: 'weekly' | 'monthly'): ChartPoint[] {
		const buckets = new Map<string, ChartPoint[]>();
		for (const point of points) {
			const key = resolution === 'weekly' ? this.weekBucketKey(point.dateLabel) : point.dateLabel.slice(0, 7);
			const bucket = buckets.get(key) ?? [];
			bucket.push(point);
			buckets.set(key, bucket);
		}

		return [...buckets.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([key, bucket]) => {
				const totalGames = bucket.reduce((sum, point) => sum + point.totalGames, 0);
				const failures = bucket.reduce((sum, point) => sum + point.failures, 0);
				const accuracy = totalGames ? 1 - (100 * failures) / totalGames : 0;
				const first = bucket[0];
				const last = bucket[bucket.length - 1];
				const dateLabel =
					resolution === 'weekly'
						? first.dateLabel === last.dateLabel
							? first.dateLabel
							: `${first.dateLabel} → ${last.dateLabel}`
						: key;
				return {
					period: first.period,
					dateLabel,
					version: last.version,
					totalGames,
					failures,
					accuracy,
					plottedAccuracy: Math.max(accuracy, ACCURACY_Y_MIN),
				};
			});
	}

	/** Monday (UTC) of the week containing the date, as YYYY-MM-DD. */
	private weekBucketKey(dateLabel: string): string {
		const date = new Date(`${dateLabel}T00:00:00.000Z`);
		const day = date.getUTCDay(); // 0 Sun .. 6 Sat
		const daysFromMonday = (day + 6) % 7;
		date.setUTCDate(date.getUTCDate() - daysFromMonday);
		return this.toDateInput(date.toISOString());
	}

	private buildChartOptions(): ChartOptions<'line'> {
		return {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				mode: 'index',
				intersect: false,
			},
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					enabled: true,
					backgroundColor: '#190505',
					titleColor: '#ffb948',
					bodyColor: '#e9cdb5',
					borderColor: '#5a3f23',
					borderWidth: 1,
					displayColors: false,
					padding: 10,
					callbacks: {
						title: (items: TooltipItem<'line'>[]) => {
							const point = this.pointForTooltip(items[0]);
							return point?.dateLabel ?? '';
						},
						label: (item: TooltipItem<'line'>) => {
							const point = this.pointForTooltip(item);
							if (!point) {
								return '';
							}
							return [
								`Version: ${point.version}`,
								`Accuracy: ${point.accuracy.toFixed(3)}`,
								`Games: ${point.totalGames.toLocaleString()}`,
								`Failures: ${point.failures.toLocaleString()}`,
							];
						},
					},
				},
			},
			scales: {
				x: {
					grid: {
						color: 'rgba(90, 63, 35, 0.45)',
					},
					ticks: {
						color: '#d9c3ab',
						font: {
							family: 'Open Sans',
						},
						maxRotation: 45,
						maxTicksLimit: 12,
					},
				},
				y: {
					grid: {
						color: 'rgba(90, 63, 35, 0.45)',
					},
					ticks: {
						color: '#d9c3ab',
						font: {
							family: 'Open Sans',
						},
					},
					suggestedMin: ACCURACY_Y_MIN,
					suggestedMax: 1,
				},
			},
		};
	}

	private pointForTooltip(item: TooltipItem<'line'> | undefined): ChartPoint | undefined {
		if (!item || item.dataIndex == null) {
			return undefined;
		}
		return this.filteredPoints[item.dataIndex];
	}

	private toDateInput(isoOrDate: string): string {
		return isoOrDate.slice(0, 10);
	}
}
