namespace HackF5.UnitySpy
{
    using JetBrains.Annotations;
    using System;

    /// <summary>
    /// Represents an object in a process' memory.
    /// </summary>
    [PublicAPI]
    public interface IMemoryObject
    {
        /// <summary>
        /// Gets the <see cref="IAssemblyImage"/> to which the object belongs.
        /// </summary>
        IAssemblyImage Image { get; }
    }
}