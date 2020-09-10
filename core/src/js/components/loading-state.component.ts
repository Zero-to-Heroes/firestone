import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';

@Component({
	selector: 'loading-state',
	styleUrls: [`../../css/component/loading-state.component.scss`],
	template: `
		<div class="loading-state">
			<div class="state-container">
				<div class="loading-icon" [inlineSVG]="loadingStateSvgName"></div>
				<span class="title" *ngIf="mainTitle"> {{ mainTitle }} </span>
				<span class="subtitle" *ngIf="subtitle">{{ subtitle }}</span>
				<span class="subtitle hint" *ngIf="hint && displayedHint">{{ displayedHint }}</span>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class LoadingStateComponent implements AfterViewInit, OnDestroy {
	@Input() mainTitle = "We're loading all the goods";
	@Input() subtitle = "Please wait while we're collecting the information";
	@Input() hint: boolean;
	@Input() set svgName(value: string) {
		if (value) {
			this.loadingStateSvgName = `assets/svg/${value}.svg`;
		}
	}

	loadingStateSvgName = 'assets/svg/loading_state.svg';
	displayedHint: string;

	private interval;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.interval = setInterval(() => {
			this.handleHint();
		}, 5000);
		this.handleHint();
	}

	ngOnDestroy() {
		if (this.interval) {
			clearInterval(this.interval);
		}
	}

	private handleHint() {
		if (this.hint) {
			this.displayedHint = this.pickDisplayHint();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}
	}

	private pickDisplayHint(): string {
		return 'You can select between local and cloud computing. Local computing will generate faster results while cloud computing will use less resources.';
	}
}
