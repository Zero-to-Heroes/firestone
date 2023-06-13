import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { WebsiteLocalizationService } from '@firestone/website/core';
import { BehaviorSubject, combineLatest } from 'rxjs';

@Component({
	selector: 'website-profile-battlegrounds-overview',
	styleUrls: [`./website-profile-battlegrounds-overview.component.scss`],
	template: `
		<div class="card overview" [helpTooltip]="tooltip">
			<div class="title">{{ title }}</div>
			<img class="icon" [src]="icon" />
			<div class="value">{{ value }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileBattlegroundsOverviewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	@Input() value: number | null;
	@Input() set mode(value: 'games-played' | 'top-4' | 'top-1') {
		this.mode$$.next(value);
	}
	@Input() set showBgTitle(value: boolean) {
		this.showBgTitle$$.next(value);
	}

	title: string;
	tooltip: string;
	icon: string;

	private mode$$ = new BehaviorSubject<'games-played' | 'top-4' | 'top-1'>('games-played');
	private showBgTitle$$ = new BehaviorSubject<boolean>(false);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: WebsiteLocalizationService) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		combineLatest([this.mode$$, this.showBgTitle$$])
			.pipe(this.mapData((info) => info))
			.subscribe(([mode, showBgTitle]) => {
				const suffix = showBgTitle ? '-with-bg' : '';
				this.title = this.i18n.translateString(`website.battlegrounds.${mode}-label-global${suffix}`);
				this.tooltip = this.i18n.translateString(`website.battlegrounds.${mode}-tooltip-global`);
				this.icon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/battlegrounds/${mode}.webp`;
			});
	}
}
