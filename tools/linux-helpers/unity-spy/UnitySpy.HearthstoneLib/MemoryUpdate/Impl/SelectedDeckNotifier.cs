using HackF5.UnitySpy.HearthstoneLib.Detail.Deck;
using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;
using System;

namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    public class SelectedDeckNotifier
    {
        private long? previousSelectedDeckId;

        private bool sentExceptionMessage = false;
        private bool hasAskedReset = false;

        internal void HandleSelectedDeck(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.FRIENDLY
                && currentScene != SceneModeEnum.TOURNAMENT
                && currentScene != SceneModeEnum.ADVENTURE)
            {
                return;
            }

            try
            {
                var selectedDeckId = mindVision.GetSelectedDeckId();
                if (selectedDeckId != null && selectedDeckId != 0 && selectedDeckId != previousSelectedDeckId)
                {
                    result.HasUpdates = true;
                    result.SelectedDeckId = selectedDeckId;
                }
                previousSelectedDeckId = selectedDeckId;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    //sentExceptionMessage = true;
                    // I'm not sure exactly what's going on there, but it looks like that some memory structures are 
                    // not properly defined the first time we read the memory, so if we get some specific access errors, 
                    // we should restart the reading process to properly read these missing structures
                    Logger.Log("Exception in SelectedDeckNotifier memory read " + e.Message + " " + e.StackTrace);
                    if (!hasAskedReset)
                    {
                        //result.ShouldReset = true;
                    }
                }
            }
        }
    }
}