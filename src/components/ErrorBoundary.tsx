import React, { Component } from 'react';

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl text-ink-title mb-2">出了点问题</h2>
          <p className="text-ink-muted text-sm mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-primary"
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
