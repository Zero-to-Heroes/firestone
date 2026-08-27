using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;
using System;
using System.Collections.Generic;
using System.Linq;

namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    public class BattlegroundsSelectedGameModeNotifier
    {
        private string lastGameMode = null;

        private bool sentExceptionMessage = false;

        internal void HandleSelection(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.BACON)
            {
                return;
            }

            try
            {
                var currentMode = mindVision.GetBattlegroundsSelectedGameMode();
                if (lastGameMode != null && lastGameMode != currentMode)
                {
                    result.BattlegroundsSelectedGameMode = currentMode;
                    result.HasUpdates = true;
                }
                lastGameMode = currentMode;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception in BattlegroundsSelectedGameModeNotifier memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }
    }
}