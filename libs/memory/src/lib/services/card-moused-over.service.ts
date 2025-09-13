import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	CARDS_HIGHLIGHT_SERVICE_TOKEN,
	ICardsHighlightService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { distinctUntilChanged, pairwise } from 'rxjs';
import { MousedOverCard, Side } from '../models/memory-update';
import { MemoryUpdatesService } from './memory-updates.service';

@Injectable()
export class CardMousedOverService extends AbstractFacadeService<CardMousedOverService> {
	public mousedOverCard$$: SubscriberAwareBehaviorSubject<MousedOverCard | null>;

	private memoryUpdates: MemoryUpdatesService;
	private cardsHighlightService: ICardsHighlightService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'CardMousedOverService', () => !!this.mousedOverCard$$);
	}

	protected override assignSubjects() {
		this.mousedOverCard$$ = this.mainInstance.mousedOverCard$$;
	}

	protected async init() {
		this.mousedOverCard$$ = new SubscriberAwareBehaviorSubject<MousedOverCard | null>(null);
		this.memoryUpdates = AppInjector.get(MemoryUpdatesService);
		this.cardsHighlightService = AppInjector.get(CARDS_HIGHLIGHT_SERVICE_TOKEN);

		this.memoryUpdates.memoryUpdates$$.subscribe((changes) => {
			const mousedOverCard = changes.MousedOverCard;
			this.mousedOverCard$$.next(mousedOverCard);
		});

		if (this.cardsHighlightService) {
			this.mousedOverCard$$
				.pipe(
					distinctUntilChanged(
						(a, b) => a?.EntityId === b?.EntityId && a?.Zone === b?.Zone && a?.Side === b?.Side,
					),
					pairwise(),
				)
				.subscribe(([previousMouseOverCard, mousedOverCard]) => {
					if (previousMouseOverCard) {
						if (!mousedOverCard || previousMouseOverCard.CardId !== mousedOverCard.CardId) {
							this.cardsHighlightService.onMouseLeave(previousMouseOverCard.CardId);
						}
					}

					if (mousedOverCard) {
						this.cardsHighlightService.onMouseEnter(
							mousedOverCard.CardId,
							mousedOverCard.Side === Side.FRIENDLY
								? 'player'
								: mousedOverCard.Side === Side.OPPOSING
									? 'opponent'
									: 'single',
						);
					}
				});
		}
	}
}
