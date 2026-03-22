import { Node } from './models';
import type { StateFacade } from './state/state-facade';

export interface GameEvent {
	Type: string;
	Value?: any;
	Debug?: GameEventDebug;
}

export interface GameEventDebug {
	CreationLogLine?: string;
	Timestamp?: string;
	Index?: number;
}

export const GameEventHelper = {
	CreateProvider(
		type: string,
		cardId: string,
		controllerId: number,
		entityId: number,
		helper: StateFacade,
		additionalProps: any = null,
		preprocess: (() => void) | null = null,
	): () => GameEvent {
		return () => {
			if (preprocess) {
				preprocess();
			}
			return {
				Type: type,
				Value: {
					CardId: cardId,
					ControllerId: controllerId,
					LocalPlayer: helper.LocalPlayer,
					OpponentPlayer: helper.OpponentPlayer,
					EntityId: entityId,
					AdditionalProps: additionalProps,
				},
			};
		};
	},

	CreateProviderWithDeferredProps(
		type: string,
		cardId: string,
		controllerId: number,
		entityId: number,
		helper: StateFacade,
		additionalPropsProvider: () => any,
	): () => GameEvent {
		return () => ({
			Type: type,
			Value: {
				CardId: cardId,
				ControllerId: controllerId,
				LocalPlayer: helper.LocalPlayer,
				OpponentPlayer: helper.OpponentPlayer,
				EntityId: entityId,
				AdditionalProps: additionalPropsProvider(),
			},
		});
	},
};

export class GameEventProvider {
	SupplyGameEvent: (() => GameEvent | null) | null = null;
	IsDuplicatePredicate: ((queued: GameEventProvider) => boolean) | null = null;
	Timestamp: string = '';
	NeedMetaData: boolean = false;
	EventName: string = '';
	CreationLogLine: string = '';
	Index: number = 0;
	GameEvent: GameEvent | null = null;
	Props: any = null;
	WaitFor: number = 0;

	static Create(
		timestamp: string,
		eventName: string,
		eventProvider: () => GameEvent | null,
		needMetaData: boolean,
		node: Node | null,
		props: any = null,
		waitFor: number = 0,
	): GameEventProvider {
		return GameEventProvider.CreateWithDuplicate(
			timestamp,
			eventName,
			eventProvider,
			() => false,
			needMetaData,
			node,
			props,
			waitFor,
		);
	}

	static CreateWithDuplicate(
		timestamp: string,
		eventName: string,
		eventProvider: () => GameEvent | null,
		isDuplicatePredicate: (queued: GameEventProvider) => boolean,
		needMetaData: boolean,
		node: Node | null,
		props: any = null,
		waitFor: number = 0,
	): GameEventProvider {
		const result = new GameEventProvider();
		result.Timestamp = timestamp;
		result.Index = node?.Index ?? 0;
		result.EventName = eventName;
		result.SupplyGameEvent = eventProvider;
		result.IsDuplicatePredicate = isDuplicatePredicate;
		result.NeedMetaData = needMetaData;
		result.CreationLogLine = node?.CreationLogLine?.trim() ?? '';
		result.Props = props;
		result.WaitFor = waitFor;
		return result;
	}
}
