export default function BackgroundGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 flex justify-between px-6 md:px-24">
      <div className="w-px h-full bg-white/[0.04] relative hidden md:block">
        <div className="absolute top-12 -left-[2px] w-[5px] h-[5px] border border-white/20 bg-[#030303]" />
        <div className="absolute bottom-12 -left-[2px] w-[5px] h-[5px] border border-white/20 bg-[#030303]" />
      </div>
      <div className="w-px h-full bg-white/[0.04] relative">
        <div className="absolute top-12 -left-[2px] w-[5px] h-[5px] border border-white/20 bg-[#030303]" />
        <div className="absolute bottom-12 -left-[2px] w-[5px] h-[5px] border border-white/20 bg-[#030303]" />
      </div>
      <div className="w-px h-full bg-white/[0.04] relative hidden lg:block" />
      <div className="w-px h-full bg-white/[0.04] relative">
        <div className="absolute top-12 -left-[2px] w-[5px] h-[5px] border border-white/20 bg-[#030303]" />
        <div className="absolute bottom-12 -left-[2px] w-[5px] h-[5px] border border-white/20 bg-[#030303]" />
      </div>
    </div>
  );
}
