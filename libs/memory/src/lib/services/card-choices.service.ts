import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { MemoryUpdatesService } from './memory-updates.service';

@Injectable({ providedIn: 'root' })
export class CardChoicesService extends AbstractFacadeService<CardChoicesService> {
	public choicesHidden$$: SubscriberAwareBehaviorSubject<boolean | null>;

	private memoryUpdates: MemoryUpdatesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'CardChoicesService', () => !!this.choicesHidden$$);
	}

	protected override assignSubjects() {
		this.choicesHidden$$ = this.mainInstance.choicesHidden$$;
	}

	protected async init() {
		this.choicesHidden$$ = new SubscriberAwareBehaviorSubject<boolean | null>(null);
		this.memoryUpdates = AppInjector.get(MemoryUpdatesService);

		this.memoryUpdates.memoryUpdates$$.subscribe((changes) => {
			const areChoicesHidden = changes.CardChoicesHidden;
			this.choicesHidden$$.next(areChoicesHidden);
		});
	}
}
