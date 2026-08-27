namespace HackF5.UnitySpy.Detail
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using HackF5.UnitySpy.Util;
    using JetBrains.Annotations;

    /// <summary>
    /// Represents a class instance in managed memory.
    /// Mono and .NET don't necessarily use the same layout scheme, but assuming it is similar this article provides
    /// some useful information:
    /// https://web.archive.org/web/20080919091745/http://msdn.microsoft.com:80/en-us/magazine/cc163791.aspx.
    /// </summary>
    [PublicAPI]
    public class ManagedClassInstance : ManagedObjectInstance
    {
        private IntPtr definitionAddress;
        private IntPtr vtable;
        private AssemblyImage image;

        public ManagedClassInstance([NotNull] AssemblyImage image, List<TypeInfo> genericTypeArguments, IntPtr address)
            : base(image, genericTypeArguments, address)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            this.image = image;
            Init();
        }

        // Sometimes reading the value right away causes some issues
        // This might make the graph construction slower, but ultimately will
        // avoid having to do module-wide resets later on
        private void Init() {
            // Fast path (the common case): read the vtable + class definition and force field resolution
            // exactly once, with no sleeps. We touch the fields eagerly because:
            // - if the read is transiently inconsistent (the vtable offset is sometimes off right after
            //   instantiation), forcing the fields surfaces the error here so we can re-read after a short
            //   pause and get the right value, instead of caching a broken instance.
            // - when creating a managed class, we usually access the fields soon after in any case.
            // Only the failure path pays for the retry loop and Thread.Sleep.
            Exception lastError = null;
            for (int tryCount = 0; tryCount < 50; tryCount++)
            {
                try
                {
                    // the address of the class instance points directly back to the class' VTable
                    this.vtable = this.ReadPtr(0x0);

                    // The VTable points to the class definition itself.
                    this.definitionAddress = this.image.Process.ReadPtr(this.vtable);

                    var _ = TypeDefinition?.Fields;

                    this.CaptureSnapshotIfEnabled();

                    // If we managed to build the fields, we are done.
                    return;
                }
                catch (Exception ex)
                {
                    lastError = ex;
                    Thread.Sleep(2);
                }
            }

            throw new Exception($"Could not properly initialize fields. vtable={this.vtable}, definitionAddress={this.definitionAddress}, " +
                $"address={this.Address}, type={this.GetType()}. Initialize exception message: {lastError?.Message}");
        }

        public override TypeDefinition TypeDefinition => this.Image.GetTypeDefinition(this.definitionAddress);

        // Tier 1a: read the whole object body once so later primitive/pointer field reads come from the buffer
        // instead of a syscall each. Only runs when ProcessFacade.UseBlockReads is enabled. If the full body
        // can't be read in one go we silently fall back to per-field syscalls.
        private void CaptureSnapshotIfEnabled()
        {
            if (!ProcessFacade.UseBlockReads)
            {
                return;
            }

            var size = this.TypeDefinition?.Size ?? 0;
            if (size <= 0)
            {
                return;
            }

            try
            {
                var buffer = new byte[size];
                this.image.Process.ReadBlock(buffer, this.Address);
                this.SetSnapshot(buffer);
            }
            catch
            {
                // Leave snapshot null; field reads will use the normal syscall path.
            }
        }
    }
}