import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import { Subscription, fromEvent } from 'rxjs';

@Component({
	standalone: false,
	selector: 'graph-with-single-value',
	styleUrls: [`../../../css/component/battlegrounds/graph-with-single-value.component.scss`],
	template: `
		<div class="container-1">
			<div style="display: flex; position: relative; height: 100%; width: 100%;">
				<canvas
					#chart
					*ngIf="!!data?.datasets?.length; else emptyState"
					baseChart
					[data]="data"
					[options]="lineChartOptions"
					[legend]="false"
					[type]="'line'"
				></canvas>
				<ng-template #emptyState>
					<battlegrounds-empty-state
						[subtitle]="emptyStateMessage"
						[emptyStateIcon]="emptyStateIcon"
					></battlegrounds-empty-state
				></ng-template>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphWithSingleValueComponent
	extends AbstractSubscriptionComponent
	implements AfterViewInit, AfterContentInit, OnDestroy
{
	@ViewChild('chart', { static: false }) chart: ElementRef;

	@Input() data: ChartData<'line'> = {
		datasets: [],
		labels: [],
	};
	@Input() emptyStateMessage: string;
	@Input() emptyStateIcon = 'assets/svg/ftue/battlegrounds.svg';

	@Input() set labelFormattingFn(value: (label: string, index: number) => string) {
		this._labelFormattingFn = value;
		this.lineChartOptions = this.buildOptions();
	}

	@Input() set reverse(value: boolean) {
		this._reverse = value;
		this.lineChartOptions = this.buildOptions();
	}

	@Input() set beginAtZero(value: boolean) {
		this._beginAtZero = value;
		this.lineChartOptions = this.buildOptions();
	}

	colors$$: Subscription;
	lineChartOptions: ChartOptions = this.buildOptions();

	private _labelFormattingFn: (label: string, index: number) => string;
	private _reverse = true;
	private _beginAtZero = true;

	constructor(protected readonly cdr: ChangeDetectorRef, private readonly el: ElementRef) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.colors$$ = fromEvent(window, 'resize')
			.pipe(this.mapData((event) => event))
			.subscribe((event) => {
				this.updateGraphColor();
			});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.colors$$?.unsubscribe();
	}

	ngAfterViewInit() {
		this.updateGraphColor();
	}

	private updateGraphColor() {
		if (this.data.datasets[0]) {
			this.data.datasets[0].backgroundColor = this.getBackgroundColor();
			this.data.datasets[0].borderColor = '#CE73B4';
		}
		this.buildOptions();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private getBackgroundColor(): string {
		if (!this.chart?.nativeElement) {
			return;
		}

		const chartContainer = this.el.nativeElement.querySelector('.container-1');
		const rect = chartContainer?.getBoundingClientRect();
		const chartHeight = rect.height;
		const gradient = this.chart.nativeElement
			?.getContext('2d')
			?.createLinearGradient(0, 0, 0, Math.round(chartHeight));
		if (!gradient) {
			return;
		}

		gradient.addColorStop(0, 'rgba(206, 115, 180, 0.8)'); // #CE73B4
		gradient.addColorStop(0.4, 'rgba(206, 115, 180, 0.4)');
		gradient.addColorStop(1, 'rgba(206, 115, 180, 0)');
		return gradient as any;
	}

	private buildOptions(): ChartOptions {
		return {
			responsive: true,
			maintainAspectRatio: false,
			layout: {
				padding: 0,
			},
			elements: {
				point: {
					radius: 0,
				},
			},
			plugins: {
				datalabels: {
					display: false,
				},

				tooltip: {
					enabled: true,
					mode: 'index',
					intersect: false,
					position: 'nearest',
					backgroundColor: '#CE73B4',
					titleColor: '#40032E',
					titleFont: {
						family: 'Open Sans',
					},
					bodyColor: '#40032E',
					bodyFont: {
						family: 'Open Sans',
					},
					padding: 5,
					caretPadding: 2,
					caretSize: 10,
					cornerRadius: 0,
					displayColors: false,
					callbacks: {
						label: (tooltipItem: TooltipItem<'line'>) =>
							this._labelFormattingFn
								? this._labelFormattingFn('' + tooltipItem.raw, 0)
								: '' + tooltipItem.raw,
					},
				},
			},
			scales: {
				xAxes: {
					grid: {
						color: '#841063',
					},
					ticks: {
						color: '#D9C3AB',
						font: {
							family: 'Open Sans',
							style: 'normal',
						},
						maxTicksLimit: 15,
					},
				},
				yAxes: {
					position: 'left',
					grid: {
						color: '#40032E',
					},
					ticks: {
						color: '#D9C3AB',
						font: {
							family: 'Open Sans',
							style: 'normal',
						},
						callback: !!this._labelFormattingFn
							? (label, index) => this._labelFormattingFn('' + label, index)
							: (label, index) => label,
					},
					beginAtZero: this._beginAtZero,
					reverse: this._reverse,
				},
			},
		};
	}
}
