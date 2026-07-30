namespace HackF5.UnitySpy.HearthstoneLib.Detail.SceneMode
{
    using System;
    using JetBrains.Annotations;

    internal static class SceneModeReader
    {
        public static SceneModeEnum? ReadSceneMode([NotNull] HearthstoneImage image)
        {
            var sceneMgr = image["SceneMgr"]?["s_instance"];
            // This regularly throws a "Only part of a ReadProcessMemory or WriteProcessMemory request was completed"
            // exception right after a scene change
            // Because this happens pretty frequently, and pollutes the logs quite a bit, for this call only we work with a 
            // try/catch
            var mode = Utils.TryGetField(sceneMgr, "m_mode");
            if (mode == null)
            {
                return null;
            }

            return (SceneModeEnum)mode;
        }

        public static int? ReadMercenariesIsSelectingTreasures(HearthstoneImage image)
        {
            if (ReadSceneMode(image) != SceneModeEnum.LETTUCE_MAP)
            {
                return null;
            }

            var sceneDisplay = image["SceneMgr"]?["s_instance"]?["m_scene"]?["m_sceneDisplay", false];
            // Don't throw an exception if the field is missing - this can happen when the scene is not fully initialized yet
            var isSelectingTreasure = sceneDisplay?["m_waitingForTreasureSelection", false] ?? false;
            if (!isSelectingTreasure) 
            { 
                return null; 
            }

            return sceneDisplay["m_selectedTreasureChoices"];
        }
    }
}
