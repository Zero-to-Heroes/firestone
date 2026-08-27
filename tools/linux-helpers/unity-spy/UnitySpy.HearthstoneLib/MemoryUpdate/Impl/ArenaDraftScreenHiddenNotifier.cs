using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;
using System;
using System.Linq;

namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    public class ArenaDraftScreenHiddenNotifier
    {
        private bool? lastHidden;

        private bool sentExceptionMessage = false;

        internal void HandleDraftScreenHidden(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.DRAFT)
            {
                return;
            }

            try
            {
                var currentHidden = mindVision.IsArenaDraftScreenHidden();
                if (lastHidden != currentHidden)
                {
                    result.HasUpdates = true;
                    result.ArenaDraftScreenHidden = currentHidden;
                    lastHidden = currentHidden;
                }
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception in ArenaCurrentCardsInDeckNArenaDraftScreenHiddenNotifierotifier memory read " + e.Message + " " + e.StackTrace);
                    //sentExceptionMessage = true;
                }
            }

        }
    }
}