import { Component, type ReactNode } from 'react';

import { AppError } from '@/components/errors/app-error';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Route/root render-error boundary. Renders the translated `AppError` fallback with a
 * reset action (re-renders the subtree). Mounted inside the providers so the fallback
 * can use tokens + i18n.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error);
    }
    // TODO: forward to the error reporter (OTel/Sentry) once wired (E-1).
  }

  reset = (): void => this.setState({ hasError: false });

  override render(): ReactNode {
    if (this.state.hasError) return <AppError onRetry={this.reset} />;
    return this.props.children;
  }
}
