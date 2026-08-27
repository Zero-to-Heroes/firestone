namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    using System;
    using System.Collections.Generic;
    using System.Data.SqlTypes;
    using System.Linq;
    using HackF5.UnitySpy.HearthstoneLib;
    using HackF5.UnitySpy.HearthstoneLib.Detail.GameDbf;
    using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;

    internal class ArenaDraftNotifier
    {
        private List<string> lastHeroes = null;
        private List<string> lastHeroPowers = null;
        private List<ArenaCardOption> lastCards = null;
        private List<string> lastPackageCards = null;
        private DraftSlotType? lastStep = null;
        private DraftMode? lastMode = null;
        private ArenaClientStateType? lastClientState = null;
        private ArenaSessionState? lastSessionState = null;
        private GameType? lastGameType = null;
        private int? lastDraftSlot = null;
        private int? lastUndergroundDraftSlot = null;
        private ArenaCardPick previousArenaPick = null;
        private ArenaCardPick previousArenaUndergroundPick = null;

        private bool sentExceptionMessage = false;
        internal void HandleStep(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.DRAFT)
            {
                return;
            }

            try
            {
                var step = mindVision.GetArenaDraftStep();
                if (step != null && lastStep != step)
                {
                    result.HasUpdates = true;
                    result.ArenaDraftStep = step.Value;
                }
                lastStep = step;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception when ArenaDraft.HandleStep memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }

        internal void HandleMode(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.DRAFT)
            {
                return;
            }

            try
            {
                var step = mindVision.GetArenaDraftMode();
                if (step != null && lastMode != step)
                {
                    result.HasUpdates = true;
                    result.ArenaDraftMode = step.Value;
                }
                lastMode = step;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception when ArenaDraft.HandleMode memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }

        internal void HandleClientState(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.DRAFT)
            {
                return;
            }

            try
            {
                var step = mindVision.GetArenaClientState();
                if (step != null && lastClientState != step)
                {
                    result.HasUpdates = true;
                    result.ArenaClientState = step.Value;
                }
                lastClientState = step;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception when ArenaDraft.HandleMode memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }

        internal void HandleSessionState(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.DRAFT)
            {
                return;
            }

            try
            {
                var step = mindVision.GetArenaSessionState();
                if (step != null && lastSessionState != step)
                {
                    result.HasUpdates = true;
                    result.ArenaSessionState = step.Value;
                }
                lastSessionState = step;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception when ArenaDraft.HandleMode memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }

        internal void HandleHeroes(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.DRAFT)
            {
                return;
            }

            try
            {
                var heroes = mindVision.GetArenaHeroOptions();
                if (heroes != null && heroes.Count > 0 && !AreEqual(lastHeroes, heroes))
                {
                    result.HasUpdates = true;
                    result.ArenaHeroOptions = heroes;
                }
                lastHeroes = heroes;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception when ArenaDraft.HandleHeroes memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }

        internal void HandleHeroPowers(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.DRAFT)
            {
                return;
            }

            try
            {
                var heroPowers = mindVision.GetArenaHeroPowerOptions();
                if (heroPowers != null && heroPowers.Count > 0 && !AreEqual(lastHeroPowers, heroPowers))
                {
                    result.HasUpdates = true;
                    result.ArenaHeroPowerOptions = heroPowers;
                }
                lastHeroPowers = heroPowers;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception when ArenaDraft.HandleHeroPowers memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }

        internal void HandleCards(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.DRAFT)
            {
                return;
            }

            try
            {
                var cards = mindVision.GetArenaCardOptions();
                if (cards != null && cards.Count > 0 && !AreEqual(lastCards, cards))
                {
                    result.HasUpdates = true;
                    result.ArenaCardOptions = cards;
                    Logger.Log($"Sending card options: {string.Join(",", cards.Select(c => c.CardId))}");
                }
                lastCards = cards;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception when ArenaDraft.HandleCards memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }

        internal void HandleCardPick(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            return;
            //if (currentScene != SceneModeEnum.DRAFT)
            //{
            //    return;
            //}

            //try
            //{
            //    var gameMode = mindVision.GetArenaGameMode();
            //    if (gameMode == GameType.GT_ARENA)
            //    {
            //        var newDraftSlot = mindVision.GetArenaCurrentDraftSlot();
            //        //Logger.Log($"[arena-draft-manager] detected Arena draft slot {newDraftSlot}");
            //        if (newDraftSlot != null && newDraftSlot != lastDraftSlot)
            //        {
            //            //Logger.Log($"[arena-draft-manager] Getting new pick");
            //            var pick = mindVision.GetArenaLatestCardPick();
            //            if (pick != null && !ArePicksEqual(pick, previousArenaPick))
            //            {
            //                result.HasUpdates = true;
            //                result.ArenaLatestCardPick = pick;
            //                // Only register the change once we have confirmed we are working with a new pick
            //                previousArenaPick = pick;
            //            }
            //        }
            //        // Once the draft slot changes, we read the info about the cards
            //        // ISSUE: sometimes it feels like the change comes too early, before the card options are updated
            //        lastDraftSlot = newDraftSlot;
            //    }
            //    else if (gameMode == GameType.GT_UNDERGROUND_ARENA)
            //    {
            //        var newDraftSlotUnderground = mindVision.GetArenaUndergroundCurrentDraftSlot();
            //        var updateFailed = false;
            //        if (newDraftSlotUnderground != null && newDraftSlotUnderground != lastUndergroundDraftSlot)
            //        {
            //            if (lastUndergroundDraftSlot != null)
            //            {
            //                Logger.Log($"[arena-draft-manager] detected Underground Arena draft slot {newDraftSlotUnderground}, {lastUndergroundDraftSlot}");
            //                mindVision.GetArenaUndergroundCurrentDraftSlot(true);
            //            }
            //            //Logger.Log($"[arena-draft-manager] Getting new pick");
            //            var pick = mindVision.GetArenaUndergroundLatestCardPick();
            //            //Logger.Log($"[arena-draft-manager] GetArenaUndergroundLatestCardPick {pick != null}, {pick}");
            //            if (pick != null && !ArePicksEqual(pick, previousArenaUndergroundPick))
            //            {
            //                result.HasUpdates = true;
            //                result.ArenaUndergroundLatestCardPick = pick;
            //                previousArenaUndergroundPick = pick;
            //            }
            //            else
            //            {
            //                Logger.Log($"[arena-draft-manager] options haven't changed yet, trying again");
            //                updateFailed = true;
            //            }
            //        }
            //        // If the new pick is the same, we try again. This likely means that the options weren't updated in time
            //        if (!updateFailed)
            //        {
            //            lastUndergroundDraftSlot = newDraftSlotUnderground;
            //        }
            //    }

            //    sentExceptionMessage = false;
            //}
            //catch (Exception e)
            //{
            //    if (!sentExceptionMessage)
            //    {
            //        Logger.Log("Exception when ArenaDraft.HandleCardPick memory read " + e.Message + " " + e.StackTrace);
            //        sentExceptionMessage = true;
            //    }
            //}
        }

        internal void HandlePackageCards(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.DRAFT)
            {
                return;
            }

            try
            {
                var cards = mindVision.GetArenaPackageCardOptions();
                if (cards != null && !AreEqual(lastPackageCards, cards))
                {
                    result.HasUpdates = true;
                    result.ArenaPackageCardOptions = cards;
                }
                lastPackageCards = cards;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception when ArenaDraft.HandlePackageCards memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }

        internal void HandleGameMode(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.DRAFT)
            {
                return;
            }

            try
            {
                var gameMode = mindVision.GetArenaGameMode();
                if (gameMode != null && gameMode != lastGameType)
                {
                    result.HasUpdates = true;
                    result.ArenaCurrentMode = gameMode;
                }
                lastGameType = gameMode;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception when ArenaDraft.HandleGameMode memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }


        private bool AreEqual<T>(IReadOnlyList<T> list1, IReadOnlyList<T> list2)
        {
            if ((list1 == null && list2 != null) || (list1 != null && list2 == null))
            {
                return false;
            }

            if (list1.Count != list2.Count)
            {
                return false;
            }

            for (var i = 0; i < list1.Count; i++)
            {
                if (!list1[i].Equals(list2[i]))
                {
                    return false;
                }
            }

            return true;
        }

        private bool ArePicksEqual(ArenaCardPick pick1, ArenaCardPick pick2)
        {
            if (pick1 == null || pick2 == null)
            {
                return false;
            }
            return AreEqual(pick1.Options.Select(o => o.CardId).ToList(), pick2.Options.Select(o => o.CardId).ToList());
        }
    }
}
