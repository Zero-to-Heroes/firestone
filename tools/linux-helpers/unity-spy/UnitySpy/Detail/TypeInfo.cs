namespace HackF5.UnitySpy.Detail
{
    using System;
    using System.Collections.Generic;
    using JetBrains.Annotations;

    /// <summary>
    /// Represents an unmanaged _MonoType instance in a Mono process. This object describes type information.
    /// There is no direct .NET equivalent, but probably comes under the umbrella of <see cref="System.Type"/>.
    /// See: _MonoType in https://github.com/Unity-Technologies/mono/blob/unity-master/mono/metadata/metadata-internals.h.
    /// </summary>
    [PublicAPI]
    public class TypeInfo : MemoryObject, ITypeInfo
    {
        public TypeInfo(AssemblyImage image, IntPtr address)
            : base(image, address)
        {
            this.Data = this.ReadPtr(0x0);
            this.Attrs = this.ReadUInt32(this.Process.SizeOfPtr);
        }

        public uint Attrs { get; }

        public IntPtr Data { get; }

        public bool IsStatic => (this.Attrs & 0x10) == 0x10;

        public bool IsConstant => (this.Attrs & 0x40) == 0x40;

        public TypeCode TypeCode => (TypeCode)(0xff & (this.Attrs >> 16));

        public bool TryGetTypeDefinition(out ITypeDefinition typeDefinition)
        {
            switch (this.TypeCode)
            {
                case TypeCode.CLASS:
                case TypeCode.SZARRAY:
                case TypeCode.GENERICINST:
                case TypeCode.VALUETYPE:
                    typeDefinition = this.Image.GetTypeDefinition(this.Process.ReadPtr(this.Data));
                    return true;
                default:
                    typeDefinition = null;
                    return false;
            }
        }

        public object GetValue(List<TypeInfo> genericTypeArguments, IntPtr address)
            => this.Process.ReadManaged(this, genericTypeArguments, address);
    }
}