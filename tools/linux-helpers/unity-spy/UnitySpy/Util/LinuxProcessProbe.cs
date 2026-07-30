#if NET5_0_OR_GREATER
namespace HackF5.UnitySpy.Util
{
    /// <summary>Diagnostic surface over <see cref="LinuxProcess"/> for the Linux harness.</summary>
    public static class LinuxProcessProbe
    {
        public static string MainModule(int processId) => LinuxProcess.GetMainModuleFileName(processId);

        public static string Version(int processId) =>
            LinuxProcess.GetPeFileVersion(LinuxProcess.GetMainModuleFileName(processId));
    }
}
#endif
