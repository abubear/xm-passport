export default function GlassContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen p-3 md:p-6 lg:p-8 flex flex-col relative z-10">
      <div
        className="flex-1 relative rounded-[2rem] overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.03) 100%)',
          padding: '1px',
        }}
      >
        <div className="absolute inset-[1px] bg-[#09090b]/90 backdrop-blur-3xl rounded-[calc(2rem-1px)] z-0" />
        <div className="relative z-10 flex flex-col h-full w-full px-6 py-6 md:px-10 md:py-8 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
