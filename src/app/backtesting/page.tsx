
import Link from 'next/link';

export default function DeprecatedBacktestingPage() {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Backtesting Feature Has Moved</h1>
      <p className="mb-2">The dedicated backtesting page is no longer in use.</p>
      <p className="mb-4">
        The backtesting feature is now available directly from the main dashboard.
        Look for the backtest button (usually a <code className="text-sm bg-muted px-1 py-0.5 rounded">TestTube2</code> icon) next to each analyzed coin.
      </p>
      <Link href="/" className="text-primary hover:underline">
        Go to Dashboard
      </Link>
    </div>
  );
}
