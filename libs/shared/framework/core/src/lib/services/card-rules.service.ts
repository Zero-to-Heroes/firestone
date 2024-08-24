import { Injectable } from '@angular/core';
import { CardRules } from '@firestone-hs/reference-data';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService } from './abstract-facade-service';
import { ApiRunner } from './api-runner';
import { AppInjector } from './app-injector';
import { WindowManagerService } from './window-manager.service';

const CARD_RULES_URL = 'https://static.firestoneapp.com/data/cards/card-rules.gz.json';

@Injectable()
export class CardRulesService extends AbstractFacadeService<CardRulesService> {
	public rules$$: SubscriberAwareBehaviorSubject<CardRules | null>;

	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'CardRulesService', () => !!this.rules$$);
	}

	protected override assignSubjects() {
		this.rules$$ = this.mainInstance.rules$$;
	}

	protected async init() {
		this.rules$$ = new SubscriberAwareBehaviorSubject<CardRules | null>(null);
		this.api = AppInjector.get(ApiRunner);

		this.rules$$.onFirstSubscribe(async () => {
			const result: CardRules | null = await this.api.callGetApi(CARD_RULES_URL);
			console.log('[card-rules] loaded rules');
			this.rules$$.next(result);
		});
	}
}
