import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="grid min-h-screen place-content-center gap-4 text-center">
        <h1 className="text-xl font-semibold">화면을 표시하지 못했습니다</h1>
        <p>새로고침 후 다시 시도해 주세요.</p>
        <a href="/" className="text-primary underline">
          처음으로 돌아가기
        </a>
      </main>
    ) : (
      this.props.children
    );
  }
}
