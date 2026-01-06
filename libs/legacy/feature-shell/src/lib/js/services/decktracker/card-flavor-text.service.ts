import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface FlavorTextInfo {
	cardId: string;
	cardName: string;
	flavorText: string;
}

@Injectable({
	providedIn: 'root',
})
export class CardFlavorTextService {
	public readonly flavorText$$ = new BehaviorSubject<FlavorTextInfo | null>(null);

	public showFlavorText(info: FlavorTextInfo): void {
		this.flavorText$$.next(info);
	}

	public hideFlavorText(): void {
		this.flavorText$$.next(null);
	}
}
