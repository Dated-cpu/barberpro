export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-text-secondary font-body">Загрузка...</p>
      </div>
    </div>
  );
}
