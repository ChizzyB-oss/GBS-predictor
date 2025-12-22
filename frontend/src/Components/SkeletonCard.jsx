export default function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-card 
                    animate-pulse border border-gray-200 dark:border-gray-700">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4" />
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/5" />
    </div>
  );
}
