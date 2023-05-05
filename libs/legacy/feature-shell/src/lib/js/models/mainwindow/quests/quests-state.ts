import { QuestsInfo } from '@firestone-hs/reference-data';
import { AppInjector } from '../../../services/app-injector';
import { LazyDataInitService } from '../../../services/lazy-data-init.service';
import { MemoryQuestsLog } from '../../../services/plugins/mind-vision/operations/get-active-quests-operation';
import { NonFunctionProperties } from '../../../services/utils';

export class QuestsState {
	readonly activeQuests: MemoryQuestsLog;
	readonly xpBonus: number;

	readonly referenceQuests: QuestsInfo = undefined;

	readonly initComplete: boolean = false;

	public static create(base: Partial<NonFunctionProperties<QuestsState>>): QuestsState {
		return Object.assign(new QuestsState(), base);
	}

	public update(base: Partial<NonFunctionProperties<QuestsState>>): QuestsState {
		return Object.assign(new QuestsState(), this, base);
	}

	public getReferenceQuests(): QuestsInfo {
		if (!this.initComplete) {
			return this.referenceQuests;
		}
		if (this.referenceQuests === undefined) {
			console.log('referenceQuests not initialized yet');
			const service = AppInjector.get<LazyDataInitService>(LazyDataInitService);
			if (service) {
				(this.referenceQuests as QuestsInfo) = null;
				service.requestLoad('reference-quests');
			}
		}
		return this.referenceQuests;
	}
}
