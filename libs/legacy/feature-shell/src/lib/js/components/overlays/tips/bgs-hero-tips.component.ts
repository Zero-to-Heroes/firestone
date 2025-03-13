import { ComponentType } from '@angular/cdk/portal';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BgsHeroStrategyTipsTooltipComponent } from '@components/battlegrounds/hero-selection/bgs-hero-strategy-tips-tooltip.component';
import { normalizeCardId } from '@components/battlegrounds/post-match/card-utils';
import { BgsStateFacadeService } from '@firestone/battlegrounds/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	selector: 'bgs-hero-tips',
	styleUrls: [
		// `../../../../css/themes/battlegrounds-theme.scss`,
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/overlays/tips/bgs-hero-tips.component.scss',
	],
	template: `
		<div
			class="root"
			[activeTheme]="'battlegrounds'"
			componentTooltip
			[componentType]="componentType"
			[componentInput]="currentHeroCardId$ | async"
			[componentTooltipAutoHide]="false"
		>
			<img src="https://static.zerotoheroes.com/hearthstone/cardart/256x/BG24_Reward_313.jpg" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroTipsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	componentType: ComponentType<BgsHeroStrategyTipsTooltipComponent> = BgsHeroStrategyTipsTooltipComponent;

	currentHeroCardId$: Observable<string>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly bgsState: BgsStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.bgsState);
		this.currentHeroCardId$ = this.bgsState.gameState$$.pipe(
			this.mapData((state) => normalizeCardId(state.currentGame?.getMainPlayer()?.cardId, this.allCards)),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
