import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService } from '@firestone/shared/framework/core';
import { combineLatest, Observable, takeUntil, tap } from 'rxjs';
import { ArenaHeroOption } from './model';

@Component({
	selector: 'arena-hero-option',
	styleUrls: ['./arena-hero-option.component.scss'],
	template: `
		<div class="option scalable" *ngIf="{ showWidget: showWidget$ | async } as value">
			<div class="info-container" *ngIf="value.showWidget">
				<div class="tier">
					<span class="label" [fsTranslate]="'app.arena.draft.hero-tier'"></span>
					<span class="value {{ tier?.toLowerCase() }}">{{ tier }}</span>
				</div>
				<div class="winrate">
					<span class="label" [fsTranslate]="'app.arena.draft.hero-winrate'"></span>
					<span class="value">{{ winrate }}</span>
				</div>
			</div>
			<arena-option-info-premium *ngIf="!value.showWidget"></arena-option-info-premium>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaHeroOptionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showWidget$: Observable<boolean>;

	@Input() set hero(value: ArenaHeroOption) {
		if (!value) {
			return;
		}
		this.tier = value.tier;
		this.winrate = (100 * value.winrate).toFixed(1) + '%';
	}

	tier: string | null;
	winrate: string | null;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.ads.isReady();

		this.showWidget$ = this.ads.hasPremiumSub$$.pipe(
			this.mapData((info) => info),
			tap((info) => console.debug('[arena-hero-option] showWidget', info)),
		);
		combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaDraftOverlayScale ?? 100)),
		])
			.pipe(takeUntil(this.destroyed$))
			.subscribe(async ([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				const element = this.el.nativeElement.querySelector('.scalable');
				if (!!element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
					this.renderer.setStyle(element, 'top', `calc(${newScale} * 1.5vh)`);
				}
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
