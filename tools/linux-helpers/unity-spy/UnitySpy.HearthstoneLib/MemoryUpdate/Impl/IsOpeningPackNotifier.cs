using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;
using System;

namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    public class IsOpeningPackNotifier
    {
        private bool lastIsOpeningPack;

        private bool sentExceptionMessage = false;

        internal void HandleIsOpeningPack(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.PACKOPENING)
            {
                return;
            }

            try
            {
                var isOpeningPack = mindVision.IsOpeningPack();
                // There are fewer unopened packs, which means we opened one, so we can trigger the update
                // to have the app request the full pack info
                if (isOpeningPack && isOpeningPack != lastIsOpeningPack)
                {
                    result.HasUpdates = true;
                    result.IsOpeningPack = isOpeningPack;
                }
                lastIsOpeningPack = isOpeningPack;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log(" Exception in IsOpeningPackNotifier memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }
    }
}