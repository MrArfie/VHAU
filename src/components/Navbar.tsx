import { Link, useLocation } from "react-router-dom";
import hauLogo from "@/assets/hau-logo.png";

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-border/80 bg-background/95 px-8 sm:px-12 py-4 max-w-7xl mx-auto backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link to="/" className="flex items-center gap-2">
        <img src={hauLogo} alt="HAU Vault" className="h-9 w-auto" />
      </Link>
      <div className="flex items-center gap-6 text-xs sm:text-sm">
        <Link
          to="/"
          className={`font-medium transition-colors ${
            location.pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Home
        </Link>
        <Link
          to="/credentials"
          className={`font-medium transition-colors ${
            location.pathname === "/credentials" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Credentials
        </Link>
        <Link
          to="/issue"
          className={`font-medium transition-colors ${
            location.pathname === "/issue" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Add credential
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
