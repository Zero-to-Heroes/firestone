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
		console.debug('[task] event', event);
		const referenceData = currentState.mercenaries.referenceData;
		const taskChain = referenceData.taskChains.find((chain) => chain.mercenaryId === event.mercenaryId);
		const collectionInfo = await this.cache.getMercenariesMergedCollectionInfo();
		const visitors = collectionInfo.Visitors;
		console.debug('[task] cleaned visitors', visitors, currentState.mercenaries.collectionInfo.Visitors);
		const currentVisitor = visitors.find((visitor) => visitor.VisitorId === taskChain.mercenaryVisitorId);
		console.debug('[task] currentVisitor', currentVisitor);
		const newVisitor = this.buildNewVisitor(currentVisitor, taskChain, event.operation);
		console.debug('[task] newVisitor', newVisitor);
		const newVisitors = !!currentVisitor
			? visitors.map((visitor) => (visitor.VisitorId === newVisitor.VisitorId ? newVisitor : visitor))
			: [...visitors, newVisitor];
		this.prefs.updateMercenariesVisitorsProgress(newVisitors);
		console.debug('[task] newVisitors', newVisitors);
		const newCollection = {
			...currentState.mercenaries.collectionInfo,
			Visitors: newVisitors,
		};
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
		// The ??? case
		if (!currentVisitor) {
			const firstTask = taskChain.tasks[0];
			return {
				TaskId: firstTask.id,
				VisitorId: taskChain.mercenaryVisitorId,
				Status: TaskStatus.CLAIMED,
				TaskProgress: 0,
				TaskChainProgress: 0,
			};
		}

		// When add:
		// - If the current task is active, flag it as CLAIMED
		// - If the current task is claimed, increment 1
		// When remove:
		// - If the current task is claimed, decrement 1
		// - If the current task is active, decrement 2? That's in fact a weird use case
		// We never want to set a status to ACTIVE manually, because it will create issues with the
		// cleaning operation that flips tasks to CLAIMED if they are not present in memory
		if (operation === 'add') {
			if (currentVisitor.Status === TaskStatus.CLAIMED || currentVisitor.Status === TaskStatus.COMPLETE) {
				const newTaskProgress = Math.min(taskChainLength - 1, currentVisitor.TaskChainProgress + 1);
				const newTask = taskChain.tasks[newTaskProgress];
				return {
					TaskId: newTask.id,
					VisitorId: taskChain.mercenaryVisitorId,
					Status: TaskStatus.CLAIMED,
					TaskProgress: 0,
					TaskChainProgress: newTaskProgress,
				};
			} else {
				return {
					TaskId: currentVisitor.TaskId,
					VisitorId: taskChain.mercenaryVisitorId,
					Status: TaskStatus.CLAIMED,
					TaskProgress: 0,
					TaskChainProgress: currentVisitor.TaskChainProgress,
				};
			}
		} else if (operation === 'remove') {
			if (currentVisitor.Status === TaskStatus.CLAIMED || currentVisitor.Status === TaskStatus.COMPLETE) {
				const newTaskProgress = Math.max(0, currentVisitor.TaskChainProgress - 1);
				const newTask = taskChain.tasks[newTaskProgress];
				return {
					TaskId: newTask.id,
					VisitorId: taskChain.mercenaryVisitorId,
					Status: currentVisitor.TaskChainProgress === 0 ? TaskStatus.ACTIVE : TaskStatus.CLAIMED,
					TaskProgress: 0,
					TaskChainProgress: newTaskProgress,
				};
			} else {
				const newTaskProgress = Math.max(0, currentVisitor.TaskChainProgress - 2);
				const newTask = taskChain.tasks[newTaskProgress];
				return {
					TaskId: newTask.id,
					VisitorId: taskChain.mercenaryVisitorId,
					Status: currentVisitor.TaskChainProgress === 0 ? TaskStatus.ACTIVE : TaskStatus.CLAIMED,
					TaskProgress: 0,
					TaskChainProgress: newTaskProgress,
				};
			}
		}
	}
}
