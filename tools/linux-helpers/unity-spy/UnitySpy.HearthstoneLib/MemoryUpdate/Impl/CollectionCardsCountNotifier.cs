using HackF5.UnitySpy.HearthstoneLib.Detail.Collection;
using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;
using HackF5.UnitySpy.HearthstoneLib.Detail.OpenPacksInfo;
using System;
using System.Collections.Generic;
using System.Linq;

namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    public class CollectionCardsCountNotifier
    {
        private int lastCardsCount;
        private int lastCardBacksCount;
        private int lastBgHeroSkinsCount;
        private int lastBoostersCount;
        private int lastCoinsCount;

        internal void HandleCollectionCardsCount(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.COLLECTIONMANAGER && currentScene != SceneModeEnum.PACKOPENING)
            {
                return;
            }

            int newCount = mindVision.GetCollectionSize();
            if (newCount != lastCardsCount)
            {
                result.HasUpdates = true;
                result.CollectionCardsCount = newCount;
                lastCardsCount = newCount;
            }
        }

        internal void HandleCollectionCardBacksCount(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.COLLECTIONMANAGER && currentScene != SceneModeEnum.PACKOPENING)
            {
                return;
            }

            int newCount = mindVision.GetCollectionCardBacksSize();
            if (newCount != lastCardBacksCount)
            {
                result.HasUpdates = true;
                result.CollectionCardBacksCount = newCount;
                lastCardBacksCount = newCount;
            }
        }

        internal void HandleCollectionBattlegroundsHeroSkinsCount(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.COLLECTIONMANAGER && currentScene != SceneModeEnum.PACKOPENING)
            {
                return;
            }

            int newCount = mindVision.GetCollectionBgHeroSkinsSize();
            if (newCount != lastBgHeroSkinsCount)
            {
                result.HasUpdates = true;
                result.CollectionBgHeroSkinsCount = newCount;
                lastBgHeroSkinsCount = newCount;
            }
        }

        internal void HandleBoostersCount(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.COLLECTIONMANAGER && currentScene != SceneModeEnum.PACKOPENING)
            {
                return;
            }

            int newCount = mindVision.GetBoostersCount();
            if (newCount != lastBoostersCount)
            {
                result.HasUpdates = true;
                result.BoostersCount = newCount;
                lastBoostersCount = newCount;
            }
        }

        internal void HandleCollectionCoinsCount(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.COLLECTIONMANAGER && currentScene != SceneModeEnum.PACKOPENING)
            {
                return;
            }

            int newCount = mindVision.GetCollectionCoinsSize();
            if (newCount != lastCoinsCount)
            {
                result.HasUpdates = true;
                result.CollectionCoinsCount = newCount;
                lastCoinsCount = newCount;
            }
        }
    }
}