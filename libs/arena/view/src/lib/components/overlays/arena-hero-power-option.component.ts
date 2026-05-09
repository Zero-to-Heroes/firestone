import { ComponentType } from '@angular/cdk/portal';
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	Input,
	ViewRef,
} from '@angular/core';
import { ArenaClassInfoTip, ArenaHeroOption } from '@firestone/arena/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService } from '@firestone/shared/framework/core';
import { MarkdownService } from 'ngx-markdown';
import { Observable, tap } from 'rxjs';
import { ArenaTipPopupComponent } from '../class-info/arena-tip-popup.component';

@Component({
	standalone: false,
	selector: 'arena-hero-power-option',
	styleUrls: ['./arena-hero-power-option.component.scss'],
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
				<div class="tip-info">
					<div
						*ngIf="tipPopupInput"
						class="tip-info-icon"
						componentTooltip
						[componentType]="tipPopupComponentType"
						[componentInput]="tipPopupInput"
						componentTooltipPosition="left"
						[componentTooltipAllowMouseOver]="true"
						[fsTranslate]="'app.arena.class-tier-list.show-more-tip'"
						inlineSVG="assets/svg/info.svg"
					></div>
				</div>
			</div>
			<arena-option-info-premium *ngIf="!value.showWidget"></arena-option-info-premium>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaHeroPowerOptionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showWidget$: Observable<boolean>;

	tipPopupComponentType: ComponentType<ArenaTipPopupComponent> = ArenaTipPopupComponent;
	tipPopupInput: ArenaClassInfoTip | null = null;

	@Input() set hero(value: ArenaHeroOption) {
		if (!value) {
			return;
		}
		this.tier = value.tier;
		this.winrate = (100 * value.winrate).toFixed(1) + '%';
		this.setTip(value.tip);
	}

	tier: string | null;
	winrate: string | null;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly markdown: MarkdownService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.ads.isReady();

		this.showWidget$ = this.ads.hasPremiumSub$$.pipe(
			this.mapData((info) => info),
			tap((info) => console.debug('[arena-hero-option] showWidget', info)),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	private async setTip(tipData: ArenaClassInfoTip | null | undefined) {
		if (!tipData?.tip) {
			this.tipPopupInput = null;
		} else {
			const html = await this.markdown.parse(tipData.tip);
			this.tipPopupInput = {
				tip: html,
				author: tipData.author,
				patchNumber: tipData.patchNumber,
				patch: tipData.patch,
				date: tipData.date,
			};
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
