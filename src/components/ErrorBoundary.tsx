import React, { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  fallbackTitle?: string;
  lang?: 'ar' | 'en';
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as any)<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Captured ErrorBoundary exception:', error, errorInfo);
  }

  handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
    if ((this as any).props.onReset) {
      (this as any).props.onReset();
    }
  };

  render() {
    const inst = this as any;
    if (inst.state.hasError) {
      const isAr = inst.props.lang === 'ar';
      const defaultTitle = isAr
        ? 'عذراً، حدث خطأ غير متوقع في هذا الجزء من الصفحة'
        : 'An unexpected error occurred in this section';

      return (
        <div className="mx-auto max-w-xl my-8 p-8 rounded-3xl bg-[#0d0d0f] border border-amber-500/30 text-center space-y-4 shadow-2xl animate-fade-in">
          <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-400 inline-block">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {inst.props.fallbackTitle || defaultTitle}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono bg-black/40 p-3 rounded-xl max-h-32 overflow-y-auto">
            {inst.state.error?.message || 'Unknown error'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-6 py-2.5 bg-amber-500 text-black font-extrabold text-xs rounded-xl hover:bg-amber-400 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isAr ? 'إعادة المحاولة' : 'Try Again'}</span>
          </button>
        </div>
      );
    }

    return inst.props.children;
  }
}

export default ErrorBoundary;
