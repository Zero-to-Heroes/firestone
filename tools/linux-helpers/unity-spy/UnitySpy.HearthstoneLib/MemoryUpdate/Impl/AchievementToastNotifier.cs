using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;
using System;

namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    public class AchievementToastNotifier
    {
        private bool lastToastStatus;

        private bool sentExceptionMessage = false;

        internal void HandleDisplayingAchievementToast(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.GAMEPLAY && currentScene != SceneModeEnum.PACKOPENING)
            {
                return;
            }

            try
            {
                var displayToast = mindVision.IsDisplayingAchievementToast();
                if (displayToast && displayToast != lastToastStatus)
                {
                    result.HasUpdates = true;
                    result.DisplayingAchievementToast = displayToast;
                }
                lastToastStatus = displayToast;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception when handling display achievement toast memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }
    }
}