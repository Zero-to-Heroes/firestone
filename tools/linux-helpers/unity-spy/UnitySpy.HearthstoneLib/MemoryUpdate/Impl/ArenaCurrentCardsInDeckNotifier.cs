using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;
using System;
using System.Linq;

namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    public class ArenaCurrentCardsInDeckNotifier
    {
        private int? lastCardsInDeck;
        private string lastCardIds;

        private bool sentExceptionMessage = false;

        internal void HandleSelection(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.DRAFT)
            {
                return;
            }

            try
            {
                var currentCardsTuple = mindVision.GetNumberOfCardsInArenaDraftDeck();
                var currentCards = currentCardsTuple?.Item1;
                var currentCardIds = currentCardsTuple?.Item2;
                if ((lastCardsInDeck != currentCards && currentCards != null) || (lastCardIds != currentCardIds && currentCardIds != null))
                {
                    result.HasUpdates = true;
                    result.ArenaCurrentCardsInDeck = currentCards.Value;
                    lastCardsInDeck = currentCards;
                    lastCardIds = currentCardIds;
                }
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                Logger.Log("Exception in ArenaCurrentCardsInDeckNotifier memory read " + e.Message + " " + e.StackTrace);
                if (!sentExceptionMessage)
                {
                    //sentExceptionMessage = true;
                }
            }

        }
    }
}