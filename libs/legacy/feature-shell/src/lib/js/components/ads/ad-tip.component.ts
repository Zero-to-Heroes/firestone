import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent, sleep } from '@firestone/shared/framework/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { TIP_URL, Tip, TipService } from '../../services/tip.service';

@Component({
	standalone: false,
	selector: 'ad-tip',
	styleUrls: [`../../../css/component/ads/ad-tip.component.scss`],
	template: `
		<div class="tip" *ngIf="tip$ | async as tip">
			<ng-container [ngSwitch]="tip.type">
				<video *ngSwitchCase="'video'" class="tip-item video" [autoplay]="true" [muted]="true" [loop]="true">
					<source [src]="tip.url" type="video/mp4" />
				</video>
				<img *ngSwitchCase="'image'" class="tip-item image" [src]="tip.url" />
			</ng-container>
			<div class="text">
				<div class="premium-banner" *ngIf="tip.premium" [owTranslate]="'app.tips.ad-tip-premium'"></div>
				{{ tip.text }}
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdTipComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	tip$: Observable<ExtendedTip>;

	private tip$$ = new BehaviorSubject<ExtendedTip | null>(null);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly tipService: TipService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.showTips();
		this.tip$ = this.tip$$.asObservable();
	}

	private async showTips() {
		while (true) {
			const tip = this.tipService.getRandomTip();
			const extendedTip: ExtendedTip = {
				...tip,
				url: `${TIP_URL}/${tip.file}`,
				text: this.i18n.translateString('app.tips.ad-tip-prefix', {
					text: tip.text,
				}),
			};
			this.tip$$.next(extendedTip);
			// Show the tip for 30 seconds
			await sleep(30000);
			this.tip$$.next(null);
			// Wait 10 seconds before showing the next tip
			await sleep(10000);
		}
	}
}

interface ExtendedTip extends Tip {
	url: string;
}
