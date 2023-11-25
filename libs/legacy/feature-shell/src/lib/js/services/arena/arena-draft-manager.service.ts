import { Injectable } from '@angular/core';
import { DraftSlotType } from '@firestone-hs/reference-data';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { Events } from '../events.service';

@Injectable()
export class ArenaDraftManagerService extends AbstractFacadeService<ArenaDraftManagerService> {
	public currentStep$$: SubscriberAwareBehaviorSubject<DraftSlotType | null>;
	public heroOptions$$: SubscriberAwareBehaviorSubject<readonly string[] | null>;
	public cardOptions$$: SubscriberAwareBehaviorSubject<readonly string[] | null>;

	private events: Events;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(
			windowManager,
			'arenaDraftManager',
			() => !!this.currentStep$$ && !!this.heroOptions$$ && !!this.cardOptions$$,
		);
	}

	protected override assignSubjects() {
		this.currentStep$$ = this.mainInstance.currentStep$$;
		this.heroOptions$$ = this.mainInstance.heroOptions$$;
		this.cardOptions$$ = this.mainInstance.cardOptions$$;
	}

	protected async init() {
		this.currentStep$$ = new SubscriberAwareBehaviorSubject<DraftSlotType | null>(null);
		this.heroOptions$$ = new SubscriberAwareBehaviorSubject<readonly string[] | null>(null);
		this.cardOptions$$ = new SubscriberAwareBehaviorSubject<readonly string[] | null>(null);
		this.events = AppInjector.get(Events);

		this.currentStep$$.onFirstSubscribe(async () => {
			console.debug('[arena-draft-maanger] init');

			this.events.on(Events.MEMORY_UPDATE).subscribe((event) => {
				const changes: MemoryUpdate = event.data[0];
				if (changes.ArenaDraftStep) {
					this.currentStep$$.next(changes.ArenaDraftStep);

					if (changes.ArenaDraftStep !== DraftSlotType.DRAFT_SLOT_HERO) {
						this.heroOptions$$.next(null);
					}
					if (changes.ArenaDraftStep !== DraftSlotType.DRAFT_SLOT_CARD) {
						this.cardOptions$$.next(null);
					}
				}
				if (!!changes.ArenaHeroOptions?.length) {
					this.heroOptions$$.next(changes.ArenaHeroOptions);
				}
				if (!!changes.ArenaCardOptions?.length) {
					this.cardOptions$$.next(changes.ArenaCardOptions);
				}
			});
		});
	}
}
