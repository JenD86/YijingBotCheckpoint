import { type FC } from "react";
import { App } from "@/components/App.tsx";
import { ErrorBoundary } from "@/components/ErrorBoundary.tsx";

const ErrorBoundaryError: FC<{ error: unknown }> = ({ error }) => (
  <div>
    <p>An unhandled error occurred:</p>
    <blockquote>
      <code>
        {error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : JSON.stringify(error)}
      </code>
    </blockquote>
  </div>
);

export const Root: FC = () => (
  <ErrorBoundary fallback={ErrorBoundaryError}>
    <App />
  </ErrorBoundary>
);
