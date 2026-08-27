using HackF5.UnitySpy.HearthstoneLib.Detail.InputManager;
using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;
using System;
using System.Collections.Generic;

namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    public class ChoiceManagerNotifier
    {
        private bool? lastChoicesHidden;

        private bool sentExceptionMessage = false;

        internal void HandleChoicesHidden(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.GAMEPLAY)
            {
                return;
            }

            try
            {
                bool isChoicesHidden = mindVision.IsCardChoicesHidden();
                if (isChoicesHidden != lastChoicesHidden)
                {
                    result.HasUpdates = true;
                    result.CardChoicesHidden = isChoicesHidden;
                }
                lastChoicesHidden = isChoicesHidden;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception in HandleChoicesHidden memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }
    }
}