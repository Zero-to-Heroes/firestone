using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;
using System;
using System.Collections.Generic;
using System.Linq;

namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    public class BattlegroundsNewRatingNotifier
    {
        private int? lastNewRating = null;

        private bool sentExceptionMessage = false;

        internal void HandleSelection(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.GAMEPLAY)
            {
                return;
            }

            try
            {
                var newRating = mindVision.GetBattlegroundsNewRating();
                if (lastNewRating != null && newRating != -1 && lastNewRating != newRating)
                {
                    result.BattlegroundsNewRating = newRating;
                    result.HasUpdates = true;
                }
                lastNewRating = newRating;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception in BattlegroundsNewRatingNotifier memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }
    }
}