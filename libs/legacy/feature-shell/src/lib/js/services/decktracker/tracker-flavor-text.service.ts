import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TrackerFlavorText {
	readonly cardId: string;
	readonly cardName: string;
	readonly flavorText: string;
}

export const toPlainFlavorText = (flavor: string): string => {
	return flavor
		.replace(/\n/g, ' ')
		.replace(/<\/?i>/gi, '')
		.replace(/<br\s*\/?>/gi, ' ')
		.replace(/\[x\]/gi, '')
		.replace(/\s+/g, ' ')
		.trim();
};

@Injectable()
export class TrackerFlavorTextService {
	public readonly hovered$$ = new BehaviorSubject<TrackerFlavorText | null>(null);

	public show(info: TrackerFlavorText): void {
		if (!info?.flavorText?.length) {
			return;
		}
		this.hovered$$.next(info);
	}

	public hide(cardId?: string): void {
		const current = this.hovered$$.value;
		if (cardId && current?.cardId && current.cardId !== cardId) {
			return;
		}
		this.hovered$$.next(null);
	}
}
