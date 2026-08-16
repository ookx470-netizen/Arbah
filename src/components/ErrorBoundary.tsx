import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    (this as Component<Props, State>).setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    const instance = this as unknown as Component<Props, State>;
    const { hasError, error } = instance.state;
    const { children, fallbackTitle } = instance.props;

    if (hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50 text-slate-800" dir="rtl">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {fallbackTitle || 'حدث خطأ غير متوقع أثناء عرض هذه الصفحة'}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                تم احتواء الخطأ لتجنب توقف باقي النظام. يمكنك إعادة تحميل الصفحة لإعادة الاتصال بشكل طبيعي.
              </p>
            </div>
            {error?.message && (
              <div className="bg-slate-100 p-3 rounded-lg text-[11px] font-mono text-slate-700 text-right overflow-x-auto max-h-24">
                {error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة تحميل الصفحة الآن</span>
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
