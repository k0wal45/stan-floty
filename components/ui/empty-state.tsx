interface EmptyStateProps {
  message: string;
  children?: React.ReactNode;
}

export function EmptyState({ message, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {children}
    </div>
  );
}