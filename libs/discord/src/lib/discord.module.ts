import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MemoryModule } from '@firestone/memory';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { DiscordPresenceManagerService } from './services/discord-presence-manager.service';
import { DiscordRpcPluginService } from './services/discord-rpc-plugin.service';
import { DiscordRpcService } from './services/discord-rpc.service';

@NgModule({
	imports: [CommonModule, SharedCommonServiceModule, MemoryModule],
	providers: [DiscordRpcPluginService, DiscordRpcService, DiscordPresenceManagerService],
})
export class DiscordModule {}
