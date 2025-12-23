import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';

export interface FlavorTextInfo {
	cardId: string;
	cardName: string;
	flavorText: string;
}

@Injectable()
export class FlavorTextService extends AbstractFacadeService<FlavorTextService> {
	public flavorText$$: SubscriberAwareBehaviorSubject<FlavorTextInfo | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'flavorText', () => !!this.flavorText$$);
	}

	protected override assignSubjects() {
		this.flavorText$$ = this.mainInstance.flavorText$$;
	}

	protected async init() {
		this.flavorText$$ = new SubscriberAwareBehaviorSubject<FlavorTextInfo | null>(null);
	}

	public showFlavorText(cardId: string, cardName: string, flavorText: string): void {
		if (!flavorText?.length) {
			return;
		}
		this.flavorText$$.next({ cardId, cardName, flavorText });
	}

	public hideFlavorText(): void {
		this.flavorText$$.next(null);
	}
}
