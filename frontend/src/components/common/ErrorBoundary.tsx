import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Atlas AI crashed:', error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-paper dark:bg-ink p-6">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-light/10 text-danger-light dark:text-danger-dark">
              <AlertTriangle size={22} />
            </div>
            <h1 className="font-display font-semibold text-lg mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-light dark:text-muted-dark mb-5">
              Atlas AI hit an unexpected error and couldn't continue. Reloading usually fixes it —
              your conversations are safely stored on the server.
            </p>
            <Button variant="primary" onClick={this.handleReset}>
              Reload Atlas AI
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
