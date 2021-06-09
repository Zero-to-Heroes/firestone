import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Optional, ViewRef } from '@angular/core';
import { DeckCard } from '../../models/decktracker/deck-card';
import { Preferences } from '../../models/preferences';
import { PreferencesService } from '../../services/preferences.service';
import { groupByFunction } from '../../services/utils';

@Component({
	selector: 'card-tooltip',
	styleUrls: [`../../../css/component/tooltip/card-tooltip.component.scss`],
	template: `
		<div class="card-tooltip {{ card.additionalClass }}" *ngFor="let card of cards">
			<div *ngIf="card.createdBy" class="created-by">Created by</div>
			<img
				*ngIf="card.image && card.cardType === 'NORMAL'"
				[src]="card.image"
				(onload)="refresh()"
				class="tooltip-image"
			/>
			<video *ngIf="card.cardType === 'GOLDEN'" #videoPlayer loop="loop" [autoplay]="true" [preload]="true">
				<source
					src="{{
						'https://static.zerotoheroes.com/hearthstone/fullcard/en/golden/' + card.cardId + '.webm?v=2'
					}}"
					type="video/webm"
				/>
			</video>
			<!-- <div *ngIf="card.text" class="text">{{ card.text }}</div> -->
			<div class="buffs" *ngIf="card.buffs && _displayBuffs" [ngClass]="{ 'only-buffs': !card.image }">
				<div class="background">
					<div class="body"></div>
					<div class="bottom"></div>
				</div>
				<div class="content">
					<buff-info *ngFor="let buff of card.buffs" [buff]="buff"></buff-info>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTooltipComponent {
	cards: readonly InternalCard[];
	_displayBuffs: boolean;

	// private image: string;
	// private _text: string;
	private _cardIds: string[];
	private isBgs: boolean;
	private _additionalClass: string;
	private createdBy: boolean;
	private buffs: readonly { bufferCardId: string; buffCardId: string; count: number }[];
	private _cardType: 'NORMAL' | 'GOLDEN' = 'NORMAL';

	@Input() set cardId(value: string) {
		this._cardIds = value?.length ? value.split(',') : [];
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
		if (!value) {
			return;
		}
		this.buffs =
			!value.buffCardIds || value.buffCardIds.length === 0
				? undefined
				: Object.values(groupByFunction((buffCardId: string) => buffCardId)(value.buffCardIds)).map(
						(buff: string[]) => ({
							buffCardId: buff[0],
							bufferCardId: buff[0].slice(0, buff[0].length - 1),
							count: buff.length,
						}),
				  );
		this.createdBy = (value.creatorCardId || value.lastAffectedByCardId) && !value.cardId;
		this._cardIds = [value.cardId || value.creatorCardId || value.lastAffectedByCardId];
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
		// this._text = value;
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	constructor(private cdr: ChangeDetectorRef, @Optional() private prefs: PreferencesService) {}

	refresh() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async updateInfos() {
		const prefs: Preferences = this.prefs ? await this.prefs.getPreferences() : null;
		// There can be multiple cardIds, in the case of normal + golden card tooltip for instance
		this.cards = this._cardIds
			// Empty card IDs are necessary when showing buff only
			// .filter((cardId) => cardId)
			.reverse()
			.map((cardId) => {
				const highRes = prefs?.collectionUseHighResImages;
				let image = null;
				if (cardId) {
					const imagePath = highRes ? '512' : 'compressed';
					const withBgs = this.isBgs
						? cardId.includes('premium')
							? `compressed/battlegrounds/${cardId}.png`
							: `compressed/battlegrounds/${cardId}_bgs.png`
						: `${imagePath}/${cardId}.png`;
					image = `https://static.zerotoheroes.com/hearthstone/fullcard/en/${withBgs}?v=3`;
				}
				return {
					cardId: cardId,
					image: image,
					// For now there are no cases where we have multiple card IDs, and different buffs for
					// each one. If the case arises, we'll have to handle this differently
					buffs: this.buffs,
					cardType: this._cardType,
					createdBy: this.createdBy,
					additionalClass: this._additionalClass,
				};
			});
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface InternalCard {
	readonly cardId: string;
	readonly image: string;
	readonly cardType: 'NORMAL' | 'GOLDEN';

	readonly createdBy?: boolean;
	readonly buffs?: readonly { bufferCardId: string; buffCardId: string; count: number }[];
	readonly additionalClass?: string;
}
