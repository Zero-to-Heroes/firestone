using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;
using System;

namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    public class CurrentSceneNotifier
    {
        private SceneModeEnum? lastScene;

        private bool sentExceptionMessage = false;

        internal SceneModeEnum? HandleSceneMode(MindVision mindVision, MemoryUpdateResult result)
        {
            try
            {
                //Console.WriteLine($"{DateTime.Now.Ticks}: trying to get scene");
                var scene = mindVision.GetSceneMode();
                if (scene != null && scene != SceneModeEnum.INVALID && scene != 0)
                {
                    //Console.WriteLine($"{DateTime.Now.Ticks}: got scene {scene}, {lastScene}");
                    if (scene != lastScene)
                    {
                        //Console.WriteLine($"{DateTime.Now.Ticks}: got new scene");
                        result.HasUpdates = true;
                        result.CurrentScene = scene;
                    }
                    lastScene = scene;
                }
                sentExceptionMessage = false;
                return scene;
            }
            catch (Exception e)
            {
                //Console.WriteLine($"got exception");
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception in CurrentSceneNotifier memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
                return null;
            }
        }
    }
}