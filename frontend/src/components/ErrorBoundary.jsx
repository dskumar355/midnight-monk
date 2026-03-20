import React from "react";

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("UI Error Caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "40px", fontFamily: "'Segoe UI', sans-serif", textAlign: "center" }}>
                    <h2>Oops! Something went wrong.</h2>
                    <p>Please refresh the page or try again later.</p>
                    <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", marginTop: "20px", cursor: "pointer", backgroundColor: "#f5a623", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold" }}>Refresh Page</button>
                </div>
            );
        }
        return this.props.children;
    }
}
