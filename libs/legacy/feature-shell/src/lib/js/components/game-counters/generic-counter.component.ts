import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { BehaviorSubject, combineLatest } from 'rxjs';

@Component({
	standalone: false,
	selector: 'generic-counter',
	styleUrls: [
		`../../../css/global/cdk-overlay.scss`,
		`../../../css/themes/decktracker-theme.scss`,
		'../../../css/component/game-counters/counters-common.scss',
		'../../../css/component/game-counters/generic-counter.component.scss',
		'../../../css/component/game-counters/attack-counter.component.scss',
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
			class="counter generic-counter scalable-other {{ counterClass }}"
			[helpTooltip]="helpTooltipText"
		>
			<div class="frame">{{ value }}</div>
			<div class="value" [inlineSVG]="image"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericCountersComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	@Input() value: number | string;
	@Input() valueImg: string;
	@Input() image: string;
	@Input() helpTooltipText: string;
	@Input() counterClass: string;
	@Input() standardCounter: boolean;

	@Input() set side(value: 'player' | 'opponent') {
		this.side$$.next(value);
	}

	private side$$ = new BehaviorSubject<'player' | 'opponent'>('player');

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterViewInit() {
		await this.prefs.isReady();

		combineLatest([
			this.side$$,
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					globalScale: prefs.globalWidgetScale ?? 100,
					scalePlayer: prefs.countersScale,
					scaleOpponent: prefs.countersScaleOpponent,
					// For the attack counter
					scalePlayerOther: prefs.countersScaleOther,
					scaleOpponentOther: prefs.countersScaleOpponentOther,
				})),
			),
		]).subscribe(([side, { globalScale, scalePlayer, scaleOpponent, scalePlayerOther, scaleOpponentOther }]) => {
			if (this.standardCounter) {
				const scale = side === 'player' ? scalePlayer : scaleOpponent;
				const newScale = (globalScale / 100) * (scale / 100);
				const element = this.el.nativeElement.querySelector('.scalable');
				if (element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				}
			} else {
				const scale = side === 'player' ? scalePlayerOther : scaleOpponentOther;
				const newScale = (globalScale / 100) * (scale / 100);
				const element = this.el.nativeElement.querySelector('.scalable-other');
				if (element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				}
			}
		});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
