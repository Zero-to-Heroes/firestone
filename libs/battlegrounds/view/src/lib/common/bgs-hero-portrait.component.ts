/* eslint-disable no-mixed-spaces-and-tabs */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	Optional,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'bgs-hero-portrait',
	styleUrls: [`./bgs-hero-portrait.component.scss`],
	template: `
		<div class="hero-portrait">
			<div class="hero-portrait-frame">
				<img class="icon" [src]="heroIcon" />
				<img
					class="frame"
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_hero_frame.png"
				/>
				<div class="name" *ngIf="name">{{ name }}</div>
			</div>
			<div class="quest-reward" *ngIf="_questRewardCardId" [cardTooltip]="_questRewardCardId">
				<img [src]="questRewardIcon" class="image" *ngIf="!!questRewardIcon" />
				<img
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_quest_reward_frame.png"
					class="frame"
				/>
			</div>
			<div class="health" [ngClass]="{ damaged: _health < _maxHealth, new: !!heroIcon }" *ngIf="_health">
				<!-- <img src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/health.png" class="icon" /> -->
				<div class="value">{{ _health }}</div>
			</div>
			<div class="rating" *ngIf="rating !== null && rating !== undefined">
				<div class="value">{{ rating?.toLocaleString('en-US') }}</div>
			</div>
			<div
				class="mmr"
				*ngIf="
					(showMmr$ | async) &&
					_mmr !== null &&
					_mmr !== undefined &&
					(rating === null || rating === undefined)
				"
				[helpTooltip]="'battlegrounds.in-game.opponents.mmr-tooltip' | fsTranslate"
			>
				<div class="value">{{ _mmr }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroPortraitComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showMmr$: Observable<boolean>;

	_health: number;
	_maxHealth: number;
	heroIcon: string;
	_questRewardCardId: string;
	questRewardIcon: string;
	_mmr: string;

	@Input() rating: number;
	@Input() name: string;

	@Input() set mmr(value: number | null) {
		this._mmr =
			value == null
				? null
				: this.i18n.translateString('battlegrounds.in-game.opponents.mmr', {
						value: value.toLocaleString(this.i18n.formatCurrentLocale()),
					});
	}

	@Input() set heroCardId(value: string) {
		this.heroIcon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value}.jpg`;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set questRewardCardId(value: string) {
		this._questRewardCardId = value;
		this.questRewardIcon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value}.jpg`;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	/** @deprecated */
	_icon: string;
	/** @deprecated */
	@Input() set icon(value: string) {
		if (value === this._icon) {
			return;
		}
		this._icon = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set health(value: number) {
		if (value === this._health) {
			return;
		}
		this._health = Math.max(value, 0);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set maxHealth(value: number) {
		if (value === this._maxHealth) {
			return;
		}
		this._maxHealth = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		@Optional() private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		this.showMmr$ = this.prefs?.preferences$$?.pipe(
			this.mapData((prefs) => prefs.bgsUseLeaderboardDataInOverlay && prefs.bgsShowMmrInOpponentRecap),
		);
	}
}
