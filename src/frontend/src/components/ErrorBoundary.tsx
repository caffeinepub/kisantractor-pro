import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="bg-card rounded-2xl shadow-lg p-6 max-w-sm w-full text-center border border-border">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              Kuch gadbad ho gayi
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Please refresh karo.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-transform"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
