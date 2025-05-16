export default function QuizTakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container max-w-screen-xl mx-auto py-4 sm:py-6">
        {children}
      </div>
    </div>
  );
} 