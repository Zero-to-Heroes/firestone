import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { WebsiteLocalizationService } from '@firestone/website/core';
import { BehaviorSubject, combineLatest } from 'rxjs';

@Component({
	selector: 'website-profile-mode-overview',
	styleUrls: [`./website-profile-mode-overview.component.scss`],
	template: `
		<div class="card overview" [helpTooltip]="tooltip">
			<div class="title">{{ title }}</div>
			<img class="icon" [src]="icon" />
			<div class="value">
				<div class="wins">{{ wins }}</div>
				<div class="losses">{{ losses }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileModeOverviewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() wins: number | null;
	@Input() losses: number | null;
	@Input() set mode(value: 'ranked' | 'duels' | 'arena') {
		this.mode$$.next(value);
	}

	title: string;
	tooltip: string;
	icon: string;

	private mode$$ = new BehaviorSubject<'ranked' | 'duels' | 'arena'>('ranked');

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: WebsiteLocalizationService) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		combineLatest([this.mode$$])
			.pipe(this.mapData((info) => info))
			.subscribe(([mode]) => {
				this.title = this.i18n.translateString(`website.${mode}.title-label-global`);
				this.tooltip = this.i18n.translateString(`website.${mode}.title-tooltip-global`);
				this.icon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/mode/${mode}.webp?v=2`;
			});
	}
}
