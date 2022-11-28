import { QuestsInfo } from '@firestone-hs/reference-data';
import { AppInjector } from '../../../services/app-injector';
import { LazyDataInitService } from '../../../services/lazy-data-init.service';
import { MemoryQuestsLog } from '../../../services/plugins/mind-vision/operations/get-active-quests-operation';
import { NonFunctionProperties } from '../../../services/utils';

export class QuestsState {
	readonly activeQuests: MemoryQuestsLog;
	readonly xpBonus: number;

	readonly referenceQuests: QuestsInfo = undefined;

	public static create(base: Partial<NonFunctionProperties<QuestsState>>): QuestsState {
		return Object.assign(new QuestsState(), base);
	}

	public update(base: Partial<NonFunctionProperties<QuestsState>>): QuestsState {
		return Object.assign(new QuestsState(), this, base);
	}

	public getReferenceQuests(): QuestsInfo {
		if (this.referenceQuests === undefined) {
			console.log('referenceQuests not initialized yet');
			(this.referenceQuests as QuestsInfo) = null;
			AppInjector.get<LazyDataInitService>(LazyDataInitService).requestLoad('reference-quests');
		}
		return this.referenceQuests;
	}
}
