import { Component, ErrorInfo, ReactNode } from 'react';
import { clearGameState, GAME_STORAGE_KEY } from '../../game/persistence';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndHome = () => {
    try {
      clearGameState();
      localStorage.removeItem(GAME_STORAGE_KEY);
      localStorage.removeItem('deeply_know_someone_game_state');
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-paper-50 dark:bg-stone-900 flex items-center justify-center p-6 text-ink-900 dark:text-stone-100 font-sans transition-colors">
          <div className="max-w-md w-full bg-paper-100 dark:bg-stone-850 rounded-3xl p-6 sm:p-8 border border-paper-border dark:border-stone-700 shadow-xl text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-paper-200 dark:bg-stone-750 text-ink-700 dark:text-stone-300 flex items-center justify-center mx-auto text-2xl shadow-inner">
              ☕
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-xl sm:text-2xl font-medium text-ink-900 dark:text-stone-100">
                對話桌面稍作休息
              </h1>
              <p className="text-xs sm:text-sm text-ink-600 dark:text-stone-400 font-serif leading-relaxed max-w-xs mx-auto">
                系統遇到了一點突發小狀況。別擔心，您的卡牌進度已妥善保存在本機中。
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-ink-900 text-paper-50 dark:bg-stone-100 dark:text-stone-900 text-sm font-medium hover:bg-ink-800 dark:hover:bg-stone-200 transition-colors shadow-sm cursor-pointer"
              >
                重新整理並恢復桌面
              </button>
              <button
                type="button"
                onClick={this.handleResetAndHome}
                className="w-full py-2.5 px-4 rounded-xl border border-paper-border dark:border-stone-700 text-ink-600 dark:text-stone-400 text-xs font-serif hover:bg-paper-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                重設狀態並返回首頁
              </button>
            </div>

            {this.state.error && (
              <details className="text-left text-[11px] text-ink-400 dark:text-stone-500 font-mono pt-3 border-t border-paper-border/70 dark:border-stone-800">
                <summary className="cursor-pointer hover:text-ink-600 dark:hover:text-stone-300 select-none">
                  檢視詳細錯誤資訊
                </summary>
                <p className="mt-2 p-2 bg-paper-200/50 dark:bg-stone-800/80 rounded-lg overflow-x-auto break-all">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
