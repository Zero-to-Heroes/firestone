/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { getDefaultHeroDbfIdForClass } from '@firestone-hs/reference-data';
import { ArenaClassInfoTip } from '@firestone/arena/common';
import { SimpleBarChartData } from '@firestone/shared/common/view';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { MarkdownService } from 'ngx-markdown';
import { ArenaTipPopupComponent } from './arena-tip-popup.component';
import { ArenaClassInfo } from './model';

const TIP_PREVIEW_LENGTH = 40;

@Component({
	standalone: false,
	selector: 'arena-class-info',
	styleUrls: [`./arena-class-tier-list-columns.scss`, `./arena-class-info.component.scss`],
	template: `
		<div class="class-info">
			<div class="background">
				<div class="background-image">
					<img [src]="backgroundImage" />
				</div>
			</div>
			<div class="cell portrait">
				<img class="icon" [src]="icon" />
			</div>
			<div class="cell class-details">
				<div class="name">{{ className }}</div>
				<div class="data-points">
					<div class="global">
						{{ dataPoints }}
					</div>
				</div>
			</div>
			<div class="cell winrate">{{ winrate }}</div>
			<div class="cell placement">
				<basic-bar-chart-2
					class="placement-distribution"
					[data]="placementChartData"
					[id]="'placementDistribution' + className"
					[offsetValue]="0"
					[dataTextFormatter]="dataTextFormatter"
				></basic-bar-chart-2>
			</div>
			<div class="cell tip" *ngIf="tipPreview">
				<span class="tip-preview">{{ tipPreview }}</span>
				<div
					*ngIf="tipFull"
					class="show-more-btn"
					componentTooltip
					[componentType]="tipPopupComponentType"
					[componentInput]="tipPopupInput"
					componentTooltipPosition="left"
					[componentTooltipAllowMouseOver]="true"
					[fsTranslate]="'app.arena.class-tier-list.show-more-tip'"
				></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaClassInfoComponent {
	@Input() set stat(value: ArenaClassInfo) {
		this.icon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${value.playerClass}.png`;
		this.className = this.i18n.translateString(`global.class.${value.playerClass}`);
		this.dataPoints = this.i18n.translateString('app.battlegrounds.tier-list.data-points', {
			value: value.dataPoints.toLocaleString(this.i18n.formatCurrentLocale() ?? 'en-US'),
		});
		this.winrate = (100 * value.winrate).toFixed(1) + '%';

		const globalPlacementChartData: SimpleBarChartData = {
			data: value.placementDistribution.map((p) => ({
				label: '' + p.wins,
				value: p.total,
			})),
		};
		this.placementChartData = [globalPlacementChartData];
		const defaultHero = getDefaultHeroDbfIdForClass(value.playerClass);
		this.backgroundImage = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this.allCards.getCard(defaultHero).id}.jpg`;
		this.setTip(value.tip);
	}

	icon: string;
	className: string | null;
	dataPoints: string | null;
	winrate: string;
	placementChartData: SimpleBarChartData[];
	dataTextFormatter = (value: string) =>
		this.i18n.translateString('app.arena.class-tier-list.graph-placement-tooltip', { value: value })!;
	backgroundImage: string;
	tipPreview = '';
	tipFull: string | null = null;

	tipPopupComponentType: ComponentType<ArenaTipPopupComponent> = ArenaTipPopupComponent;
	tipPopupInput: ArenaClassInfoTip | null = null;

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly markdown: MarkdownService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	private async setTip(tipData: ArenaClassInfoTip | null | undefined) {
		if (!tipData?.tip) {
			this.tipPreview = '';
			this.tipFull = null;
			this.tipPopupInput = null;
		} else {
			const html = await this.markdown.parse(tipData.tip);
			const plainText = html ? stripHtml(html) : '';
			if (plainText.length > TIP_PREVIEW_LENGTH) {
				this.tipPreview = plainText.slice(0, TIP_PREVIEW_LENGTH) + '...';
				this.tipFull = html;
				this.tipPopupInput = {
					tip: html,
					author: tipData.author,
					patchNumber: tipData.patchNumber,
					patch: tipData.patch,
					date: tipData.date,
				};
			} else {
				this.tipPreview = plainText;
				this.tipFull = null;
				this.tipPopupInput = null;
			}
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}

function stripHtml(html: string): string {
	if (typeof document === 'undefined') {
		return html.replace(/<[^>]*>/g, '');
	}
	const tmp = document.createElement('div');
	tmp.innerHTML = html;
	return (tmp.textContent || tmp.innerText || '').trim();
}
