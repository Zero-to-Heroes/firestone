export type BgsReconnectorPlugin = {
	Init(): void;
	triggerReconnect(address: string, port: number, callback: (result: string) => void): void;
};
