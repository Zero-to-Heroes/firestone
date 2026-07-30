using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;
using System;

namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    public class AchievementCompletionNotifier
    {
        private int? lastNumberCompleted;

        private bool sentExceptionMessage = false;

        internal void HandleAchievementsCompleted(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.GAMEPLAY && currentScene != SceneModeEnum.PACKOPENING)
            {
                return;
            }

            try
            {
                int? numberCompleted = mindVision.GetNumberOfCompletedAchievements();
                if (numberCompleted != null && numberCompleted != lastNumberCompleted)
                {
                    result.HasUpdates = true;
                    result.NumberOfAchievementsCompleted = numberCompleted;
                }
                lastNumberCompleted = numberCompleted;
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