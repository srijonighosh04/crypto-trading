"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Standard React Class Component implementing Error Boundaries.
 * Isolates runtime widget failures without crashing the entire page.
 */
export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary Caught Exception]", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-danger/30 bg-[#0c0d14]/80 backdrop-blur-sm p-6 text-center select-none flex flex-col items-center justify-center min-h-[160px] space-y-3">
          <AlertCircle className="h-7 w-7 text-danger animate-pulse" />
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              {this.props.fallbackTitle || "Widget Load Failed"}
            </h4>
            <p className="text-xxs text-text-muted mt-1 max-w-xs mx-auto">
              {this.state.error?.message || "An unexpected rendering crash occurred in this section."}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg bg-card-light hover:bg-[#1f2235] px-3.5 py-1.5 text-xxs font-semibold text-white/95 border border-border/60 transition active:scale-[0.98]"
          >
            <RotateCcw className="h-3 w-3 text-accent" />
            <span>Reset Section</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
