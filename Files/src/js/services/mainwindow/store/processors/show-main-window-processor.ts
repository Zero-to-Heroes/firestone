import { Processor } from "./processor";
import { MainWindowState } from "../../../../models/mainwindow/main-window-state";
import { CloseMainWindowEvent } from "../events/close-main-window-event";
import { ShowMainWindowEvent } from "../events/show-main-window-event";

export class ShowMainWindowProcessor implements Processor {

    public async process(event: ShowMainWindowEvent, currentState: MainWindowState): Promise<MainWindowState> {
        return Object.assign(new MainWindowState(), currentState, {
            isVisible: true,
        } as MainWindowState);
    }
}