namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    using System;
    using System.Collections.Generic;
    using HackF5.UnitySpy.HearthstoneLib;
    using HackF5.UnitySpy.HearthstoneLib.Detail.ArenaInfo;
    using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;

    internal class ArenaRewardsNotifier
    {
        private IReadOnlyList<IRewardInfo> lastRewards;

        private bool sentExceptionMessage = false;

        internal void HandleArenaRewards(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.DRAFT)
            {
                return;
            }

            try
            {
                var rewards = mindVision.GetArenaInfo()?.Rewards;
                if (rewards != null && rewards.Count > 0 && !AreEqual(lastRewards, rewards))
                {
                    result.HasUpdates = true;
                    result.ArenaRewards = rewards;
                }
                lastRewards = rewards;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception when HandleArenaRewards memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }

        private bool AreEqual(IReadOnlyList<IRewardInfo> lastRewards, IReadOnlyList<IRewardInfo> rewards)
        {
            if (lastRewards == null)
            {
                return false;
            }

            if (lastRewards.Count != rewards.Count)
            {
                return false;
            }

            for (var i = 0; i < rewards.Count; i++)
            {
                if (!lastRewards[i].Equals(rewards[i]))
                {
                    return false;
                }
            }

            return true;
        }
    }
}
