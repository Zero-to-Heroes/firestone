import { TaskStatus } from '@firestone-hs/reference-data';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { MemoryVisitor } from '../../../../../models/memory/memory-mercenaries-collection-info';
import { MercenariesMemoryCacheService } from '../../../../mercenaries/mercenaries-memory-cache.service';
import { MercenariesReferenceData } from '../../../../mercenaries/mercenaries-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { MercenariesTaskUpdateCurrentStepEvent } from '../../events/mercenaries/mercenaries-task-update-current-step-event';
import { Processor } from '../processor';

export class MercenariesTaskUpdateCurrentStepProcessor implements Processor {
	constructor(private readonly cache: MercenariesMemoryCacheService, private readonly prefs: PreferencesService) {}

	public async process(
		event: MercenariesTaskUpdateCurrentStepEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		// console.debug('[task] event', event);
		const referenceData = currentState.mercenaries.referenceData;
		const taskChain = referenceData.taskChains.find((chain) => chain.mercenaryId === event.mercenaryId);
		const collectionInfo = await this.cache.getMercenariesMergedCollectionInfo();
		const visitors = collectionInfo.Visitors;
		// console.debug('[task] cleaned visitors', visitors, currentState.mercenaries.collectionInfo.Visitors);
		const currentVisitor = visitors.find((visitor) => visitor.VisitorId === taskChain.mercenaryVisitorId);
		// console.debug('[task] currentVisitor', currentVisitor);
		const newVisitor = this.buildNewVisitor(currentVisitor, taskChain, event.operation);
		// console.debug('[task] newVisitor', newVisitor);
		const newVisitors = !!currentVisitor
			? visitors.map((visitor) => (visitor.VisitorId === newVisitor.VisitorId ? newVisitor : visitor))
			: [...visitors, newVisitor];
		this.prefs.updateMercenariesVisitorsProgress(newVisitors);
		// console.debug('[task] newVisitors', newVisitors);
		const newCollection = {
			...currentState.mercenaries.collectionInfo,
			Visitors: newVisitors,
		};
		// this.cache.saveLocalMercenariesCollectionInfo(newCollection);
		return [
			currentState.update({
				mercenaries: currentState.mercenaries.update({
					collectionInfo: newCollection,
				}),
			}),
			null,
		];
	}

	private buildNewVisitor(
		currentVisitor: MemoryVisitor | null,
		taskChain: MercenariesReferenceData['taskChains'][0],
		operation: 'add' | 'remove',
	): MemoryVisitor {
		const taskChainLength = Math.min(18, taskChain.tasks.length);
		const newTaskProgress =
			operation === 'add'
				? Math.min(taskChainLength - 1, (currentVisitor?.TaskChainProgress ?? -1) + 1)
				: Math.max(0, (currentVisitor.TaskChainProgress ?? 1) - 1);
		const taskId = taskChain.tasks[newTaskProgress].id;
		const newVisitor: MemoryVisitor = {
			TaskId: taskId,
			VisitorId: taskChain.mercenaryVisitorId,
			Status: newTaskProgress === taskChainLength ? TaskStatus.CLAIMED : TaskStatus.ACTIVE,
			TaskProgress: 0,
			TaskChainProgress: newTaskProgress,
		};
		return newVisitor;
	}
}
