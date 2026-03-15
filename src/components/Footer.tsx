import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/80 bg-muted/30">
      <div className="mx-auto max-w-7xl px-8 sm:px-12 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Holy Angel University
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              HAU Vault — Decentralized Academic Credentialing System
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/80">
              Thesis / Research Prototype · Blockchain-based verifiable credentials (ERC-721)
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link
              to="/credentials"
              className="text-sm font-medium text-primary hover:underline"
            >
              Verify credentials →
            </Link>
            <p className="text-xs text-muted-foreground">
              © {currentYear} HAU Vault. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
