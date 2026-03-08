import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#0a0a0a",
          color: "#e0e0e0",
          fontFamily: "monospace",
        }}>
          <h1 style={{ color: "#ef4444", marginBottom: 16 }}>Something went wrong</h1>
          <pre style={{
            background: "#1a1a1a",
            padding: 16,
            borderRadius: 8,
            overflow: "auto",
            maxWidth: "100%",
            fontSize: 12,
          }}>
            {this.state.error.message}
          </pre>
          <pre style={{ marginTop: 12, fontSize: 11, color: "#888" }}>
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 24,
              padding: "8px 16px",
              background: "#cc0000",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
