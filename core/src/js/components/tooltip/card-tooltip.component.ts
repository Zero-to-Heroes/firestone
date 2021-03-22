import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Optional, ViewRef } from '@angular/core';
import { DeckCard } from '../../models/decktracker/deck-card';
import { Preferences } from '../../models/preferences';
import { PreferencesService } from '../../services/preferences.service';
import { groupByFunction } from '../../services/utils';

@Component({
	selector: 'card-tooltip',
	styleUrls: [`../../../css/component/tooltip/card-tooltip.component.scss`],
	template: `
		<div class="card-tooltip {{ _additionalClass }}">
			<div *ngIf="createdBy" class="created-by">Created by</div>
			<img *ngIf="image && _cardType === 'NORMAL'" [src]="image" (onload)="refresh()" class="tooltip-image" />
			<video *ngIf="_cardType === 'GOLDEN'" #videoPlayer loop="loop" [autoplay]="true" [preload]="true">
				<source
					src="{{
						'https://static.zerotoheroes.com/hearthstone/fullcard/en/golden/' + _cardId + '.webm?v=2'
					}}"
					type="video/webm"
				/>
			</video>
			<div *ngIf="_text" class="text">{{ _text }}</div>
			<div class="buffs" *ngIf="buffs && _displayBuffs" [ngClass]="{ 'only-buffs': !image }">
				<div class="background">
					<div class="body"></div>
					<div class="bottom"></div>
				</div>
				<div class="content">
					<buff-info *ngFor="let buff of buffs" [buff]="buff"></buff-info>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTooltipComponent {
	image: string;
	_text: string;
	_displayBuffs: boolean;
	createdBy: boolean;
	_additionalClass: string;
	buffs: readonly { bufferCardId: string; buffCardId: string; count: number }[];
	_cardId: string;
	_cardType: 'NORMAL' | 'GOLDEN' = 'NORMAL';
	isBgs: boolean;

	@Input() set cardId(value: string) {
		this._cardId = value;
		this.updateInfos();
	}

	@Input() set cardType(value: 'NORMAL' | 'GOLDEN') {
		this._cardType = value;
		this.updateInfos();
	}

	@Input() set cardTooltipBgs(value: boolean) {
		this.isBgs = value;
		this.updateInfos();
	}

	@Input() set cardTooltipCard(value: DeckCard) {
		// console.log('setting card in tooltip', value);
		if (!value) {
			return;
		}
		const createdBy = (value.creatorCardId || value.lastAffectedByCardId) && !value.cardId;
		if (createdBy) {
			this.createdBy = true;
		} else {
			this.createdBy = false;
		}
		if (!value.buffCardIds || value.buffCardIds.length === 0) {
			this.buffs = undefined;
		} else {
			this.buffs = Object.values(groupByFunction((buffCardId: string) => buffCardId)(value.buffCardIds)).map(
				(buff: string[]) => ({
					buffCardId: buff[0],
					bufferCardId: buff[0].slice(0, buff[0].length - 1),
					count: buff.length,
				}),
			);
			// console.log('buffs are', this.buffs);
		}
		this._cardId = value.cardId || value.creatorCardId || value.lastAffectedByCardId;
		this.updateInfos();
	}

	@Input() set additionalClass(value: string) {
		this._additionalClass = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set displayBuffs(value: boolean) {
		this._displayBuffs = value;
	}

	@Input() set text(value: string) {
		this._text = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private cdr: ChangeDetectorRef, @Optional() private prefs: PreferencesService) {}

	refresh() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async updateInfos() {
		if (!this._cardId) {
			this.image = undefined;
		} else {
			const prefs: Preferences = this.prefs ? await this.prefs.getPreferences() : null;
			const highRes = prefs?.collectionUseHighResImages;
			// if (!(this.cdr as ViewRef)?.destroyed) {
			// 	this.cdr.detectChanges();
			// }
			const imagePath = highRes ? '512' : 'compressed';
			const withBgs = this.isBgs
				? `compressed/battlegrounds/${this._cardId}_bgs.png`
				: `${imagePath}/${this._cardId}.png`;
			this.image = `https://static.zerotoheroes.com/hearthstone/fullcard/en/${withBgs}?v=3`;
			// console.log('image is', this.image);
		}
		// console.log('setting tooltip', value, this.image);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
