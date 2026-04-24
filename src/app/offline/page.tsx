export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-8 text-center">
      <div className="txt-mono-label mb-3">offline</div>
      <h1 className="font-display text-[24px] font-medium mb-2">No connection</h1>
      <p className="text-[13px] text-fg-muted max-w-xs">
        Coin Cache keeps your data local. Reconnect to sync and use AI features.
      </p>
    </div>
  );
}
