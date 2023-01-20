import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
} from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';

@Component({
	selector: 'generic-counter',
	styleUrls: [
		`../../../css/global/cdk-overlay.scss`,
		`../../../css/themes/decktracker-theme.scss`,
		'../../../css/component/game-counters/counters-common.scss',
		'../../../css/component/game-counters/generic-counter.component.scss',
		'../../../css/component/game-counters/jade-counter.component.scss',
		'../../../css/component/game-counters/attack-counter.component.scss',
		'../../../css/component/game-counters/pogo-counter.component.scss',
	],
	template: `
		<div
			*ngIf="standardCounter"
			class="counter generic-counter scalable  {{ counterClass }}"
			[helpTooltip]="helpTooltipText"
		>
			<img class="image" [src]="image" />
			<div class="frame"></div>
			<div class="value" *ngIf="value != null">{{ value }}</div>
			<div class="value-img" *ngIf="valueImg != null">
				<img class="image" [src]="valueImg" />
				<div class="frame"></div>
			</div>
		</div>
		<div
			*ngIf="!standardCounter"
			class="counter generic-counter {{ counterClass }}"
			[helpTooltip]="helpTooltipText"
		>
			<div class="frame">{{ value }}</div>
			<div class="value" [inlineSVG]="image"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericCountersComponent extends AbstractSubscriptionStoreComponent implements AfterViewInit {
	@Input() value: number | string;
	@Input() valueImg: string;
	@Input() image: string;
	@Input() helpTooltipText: string;
	@Input() counterClass: string;
	@Input() standardCounter: boolean;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
	) {
		super(store, cdr);
	}

	ngAfterViewInit(): void {
		this.listenForBasicPref$((prefs) => prefs.countersScale).subscribe((scale) => {
			const element = this.el.nativeElement.querySelector('.scalable');
			if (element) {
				this.renderer.setStyle(element, 'transform', `scale(${scale / 100})`);
			}
		});
	}
}
