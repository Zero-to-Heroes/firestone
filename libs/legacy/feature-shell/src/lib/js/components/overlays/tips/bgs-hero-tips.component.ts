import { ComponentType } from '@angular/cdk/portal';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsHeroStrategyTipsTooltipComponent } from '@components/battlegrounds/hero-selection/bgs-hero-strategy-tips-tooltip.component';
import { normalizeCardId } from '@components/battlegrounds/post-match/card-utils';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'bgs-hero-tips',
	styleUrls: [
		`../../../../css/themes/battlegrounds-theme.scss`,
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
export class BgsHeroTipsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	componentType: ComponentType<BgsHeroStrategyTipsTooltipComponent> = BgsHeroStrategyTipsTooltipComponent;

	currentHeroCardId$: Observable<string>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.currentHeroCardId$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.getMainPlayer()?.cardId)
			.pipe(this.mapData(([cardId]) => normalizeCardId(cardId, this.allCards)));
	}
}
