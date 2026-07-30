using HackF5.UnitySpy.HearthstoneLib.Detail.InputManager;
using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;
using System;
using System.Collections.Generic;

namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    public class CardMouseOverNotifier
    {
        private MousedOverCard lastCard;

        private bool sentExceptionMessage = false;

        internal void HandleMouseOver(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            try
            {
                MousedOverCard mousedOverCard = null;
                if (currentScene == SceneModeEnum.GAMEPLAY)
                {
                    mousedOverCard = mindVision.GetCurrentMousedOverBgLeaderboardTile()
                        ?? mindVision.GetCurrentMousedOverCard();
                }
                else if (currentScene == SceneModeEnum.DRAFT)
                {
                    mousedOverCard = mindVision.GetMousedOverDraftOption();
                }
                if ((mousedOverCard == null && lastCard != null) || (mousedOverCard != null && !mousedOverCard.Equals(lastCard)))
                {
                    result.HasUpdates = true;
                    result.MousedOverCard = mousedOverCard;
                }
                lastCard = mousedOverCard;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception in CardMouseOverNotifier memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }
    }
}