namespace HackF5.UnitySpy.HearthstoneLib.Detail.TurnTimer
{
    using System;
    using JetBrains.Annotations;

    internal static class TurnTimerReader
    {
        public static TurnTimer ReadTurnTimer([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            if (image["TurnTimer"] == null || image["TurnTimer"]["s_instance"] == null)
            {
                return null;
            }

            var turnTimer = image["TurnTimer"]["s_instance"];
            return new TurnTimer()
            {
                CurrentTimestamp = (long)DateTime.Now.Subtract(new DateTime(1970, 1, 1)).TotalMilliseconds,
                CountdownEndTimestamp = turnTimer["m_countdownEndTimestamp"],
                CountdownTimeoutSec = turnTimer["m_countdownTimeoutSec"]
            };
        }
    }
}
