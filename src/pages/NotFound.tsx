import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
        <p className="mt-1 text-sm text-muted-foreground/80">The requested resource could not be found.</p>
        <Link
          to="/"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
