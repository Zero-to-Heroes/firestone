// Because interfaces cannot be used as DI tokens
export abstract class IGameEventsPlugin {
	public abstract init(onGameEventReceived: (gameEvent) => void);
	public abstract isReady(): Promise<boolean>;
	public abstract askForGameStateUpdate();
	public abstract realtimeLogProcessing(lines: readonly string[]): Promise<void>;
}
