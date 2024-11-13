import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { MousedOverCard } from '../models/memory-update';
import { MemoryUpdatesService } from './memory-updates.service';

@Injectable()
export class CardMousedOverService extends AbstractFacadeService<CardMousedOverService> {
	public mousedOverCard$$: SubscriberAwareBehaviorSubject<MousedOverCard | null>;

	private memoryUpdates: MemoryUpdatesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'CardMousedOverService', () => !!this.mousedOverCard$$);
	}

	protected override assignSubjects() {
		this.mousedOverCard$$ = this.mainInstance.mousedOverCard$$;
	}

	protected async init() {
		this.mousedOverCard$$ = new SubscriberAwareBehaviorSubject<MousedOverCard | null>(null);
		this.memoryUpdates = AppInjector.get(MemoryUpdatesService);

		this.mousedOverCard$$.onFirstSubscribe(async () => {
			this.memoryUpdates.memoryUpdates$$.subscribe((changes) => {
				const mousedOverCard = changes.MousedOverCard;
				console.debug('[memory] [card-moused-over] new moused over card', mousedOverCard);
				this.mousedOverCard$$.next(mousedOverCard);
			});
		});
	}
}
