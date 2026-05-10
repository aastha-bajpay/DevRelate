import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State;
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    // Escape hatch for strict TS environments where this.props/state are not recognized on class
    const state = this.state;
    const props = (this as any).props as Props;

    if (state.hasError) {
      if (props.fallback) {
        return props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-red-500 bg-red-50 text-red-900 font-mono">
          <AlertTriangle className="w-12 h-12 mb-4" />
          <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Circuit Breaker Tripped</h2>
          <p className="text-sm opacity-70 mb-6 text-center max-w-md">
            The DevRelate dashboard encountered a rendering exception in this node.
            Check logs for segment: {state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-red-900 text-white px-6 py-3 uppercase text-xs tracking-widest hover:bg-black transition-colors"
          >
            <RotateCcw size={14} />
            Reset Node
          </button>
        </div>
      );
    }

    return props.children;
  }
}

export default ErrorBoundary;
