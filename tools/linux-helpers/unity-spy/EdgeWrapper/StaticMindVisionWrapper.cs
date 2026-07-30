namespace FirestoneMindVisionEdge
{
    using System;
    using System.Diagnostics;
    using System.Linq;
    using System.Threading.Tasks;
    using HackF5.UnitySpy.HearthstoneLib;

    // edge-js calls: async Task<object> Method(dynamic input). This mirrors the shape of
    // Overwolf's StaticMindVisionWrapper so the existing mind-vision-edge.js bridge can call it.
    public static class StaticMindVisionWrapper
    {
        private static MindVision mindVision;

        private static MindVision Instance()
        {
            if (mindVision != null)
            {
                return mindVision;
            }

            var proc = Process.GetProcessesByName("Hearthstone").FirstOrDefault()
                       ?? Process.GetProcessesByName("Hearthstone.exe").FirstOrDefault();
            if (proc == null)
            {
                throw new InvalidOperationException("Hearthstone is not running.");
            }

            mindVision = new MindVision(null, "Hearthstone", proc.Id);
            return mindVision;
        }

        public static Task<object> getCurrentScene(object input) =>
            Task.FromResult<object>(Instance().GetSceneMode()?.ToString());

        public static Task<object> getCollectionSize(object input) =>
            Task.FromResult<object>(Instance().GetCollectionSize());

        public static Task<object> isRunning(object input) =>
            Task.FromResult<object>(
                Process.GetProcessesByName("Hearthstone.exe").Any()
                || Process.GetProcessesByName("Hearthstone").Any());
    }
}
