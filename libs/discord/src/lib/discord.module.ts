import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MemoryModule } from '@firestone/memory';
import { DiscordRpcPluginService } from './services/discord-rpc-plugin.service';
import { DiscordRpcService } from './services/discord-rpc.service';
import { DiscordPresenceManagerService } from './services/presence-manager.service';

@NgModule({
	imports: [CommonModule, MemoryModule],
	providers: [DiscordRpcPluginService, DiscordRpcService, DiscordPresenceManagerService],
})
export class DiscordModule {}
