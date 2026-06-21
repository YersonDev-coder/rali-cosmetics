export default function LoadingSpinner({ size = 'md', fullPage = false }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const spinner = (
    <div className={`${sizes[size]} border-4 border-primary-light border-t-primary rounded-full animate-spin`} />
  );
  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {spinner}
      </div>
    );
  }
  return spinner;
}
