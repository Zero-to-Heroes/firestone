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
import { CounterInstance } from './_counter-definition-v2';

@Component({
	selector: 'generic-counter-v2',
	styleUrls: ['./generic-counter-v2.component.scss'],
	template: `
		<div
			class="counter generic-counter scalable {{ theme }}"
			[helpTooltip]="helpTooltipText"
			cardTooltip
			[cardTooltipRelatedCardIds]="cardTooltip"
		>
			<img class="image" [src]="image" />
			<div class="frame"></div>
			<div class="value-container" *ngIf="value !== null && value !== undefined">
				<div class="value">{{ value }}</div>
			</div>
			<div class="value-img" *ngIf="valueImg !== null && valueImg !== undefined">
				<img class="image" [src]="valueImg" />
				<div class="frame"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericCountersV2Component extends AbstractSubscriptionComponent implements AfterViewInit {
	value: number | string | undefined | null;
	valueImg: string | undefined;
	cardTooltip: readonly string[] | undefined;
	image: string;
	helpTooltipText: string | null;
	theme: string;

	@Input() set side(value: 'player' | 'opponent') {
		this.side$$.next(value);
	}

	@Input() set counter(value: CounterInstance<any>) {
		this.image = value.image;
		this.helpTooltipText = value.tooltip;
		this.value = value.value;
		this.valueImg = value.valueImg;
		this.cardTooltip = value.cardTooltip;
		this.theme = value.type === 'battlegrounds' ? 'battlegrounds-theme' : 'decktracker-theme';
	}

	private side$$ = new BehaviorSubject<'player' | 'opponent'>('player');

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
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
				})),
			),
		]).subscribe(([side, { globalScale, scalePlayer, scaleOpponent }]) => {
			const scale = side === 'player' ? scalePlayer : scaleOpponent;
			const newScale = (globalScale / 100) * (scale / 100);
			const element = this.el.nativeElement.querySelector('.scalable');
			if (element) {
				this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
			}
		});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
