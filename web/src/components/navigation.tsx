"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, Trash2, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ContactDialog } from "@/components/contact-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavigationProps {
  variant?: "default" | "ai";
  isLoomPage?: boolean;
  onClear?: () => void;
  hasActiveArtifact?: boolean;
}

export function Navigation({
  variant = "default",
  isLoomPage = false,
  onClear,
  hasActiveArtifact = false,
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const pathname = usePathname();
  const isAIVariant = variant === "ai";

  useEffect(() => {
    const saved = sessionStorage.getItem("mobileMenuOpen");
    if (saved === "true") {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("mobileMenuOpen", isOpen.toString());
  }, [isOpen]);

  const handleContactClick = () => {
    setContactDialogOpen(true);
  };

  return (
    <nav className="fixed top-[15px] left-0 right-0 z-[60] px-3 pointer-events-none">
      {/* Mobile Navigation (or AI variant) */}
      <div
        className={cn(
          "flex items-center justify-between gap-[6px] w-full pointer-events-auto relative z-50",
          isAIVariant ? "" : "sm:hidden",
        )}
      >
        <AnimatePresence mode="wait">
          {!isOpen && (
            <motion.div
              key="otherdev-pill"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                asChild
                variant="nav"
                size="nav-default"
                className={pathname === "/" ? "text-foreground" : ""}
              >
                <Link href="/" data-slot="nav-item">
                  other dev
                </Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hamburger/X Button */}
        <Button
          variant="nav"
          size="nav-icon"
          onClick={() => setIsOpen(!isOpen)}
          data-slot="nav-item"
          className="text-foreground"
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="x-icon"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <X size={16} strokeWidth={1.5} />
              </motion.div>
            ) : (
              <motion.div
                key="menu-icon"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={16} strokeWidth={1.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              key="menu-open"
              className="flex items-center gap-1.5 flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <Button
                  asChild
                  variant="nav"
                  size="nav-mobile"
                  className={
                    pathname?.startsWith("/work") ? "text-foreground" : ""
                  }
                >
                  <Link href="/work" data-slot="nav-item">
                    work
                  </Link>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Button
                  asChild
                  variant="nav"
                  size="nav-mobile"
                  className={
                    pathname?.startsWith("/about") ? "text-foreground" : ""
                  }
                >
                  <Link href="/about" data-slot="nav-item">
                    about
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                <Button
                  asChild
                  variant="nav"
                  size="nav-mobile"
                  className={
                    pathname?.startsWith("/loom") ? "text-foreground" : ""
                  }
                >
                  <Link href="/loom" data-slot="nav-item">
                    ai
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.26, duration: 0.3 }}
              >
                <Button
                  asChild
                  variant="nav"
                  size="nav-mobile"
                  className={
                    pathname === "/work/ads-portfolio" ? "text-foreground" : ""
                  }
                >
                  <Link href="/work/ads-portfolio" data-slot="nav-item">
                    ads
                  </Link>
                </Button>
              </motion.div>
              {/* <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.27, duration: 0.3 }}
              >
                <Button
                  variant="nav"
                  size="nav-mobile-wide"
                  onClick={handleContactClick}
                  data-slot="nav-item"
                >
                  Contact
                </Button>
              </motion.div> */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.32, duration: 0.3 }}
              >
                <Button asChild variant="nav" size="nav-mobile-wide">
                  <Link
                    href="https://wa.me/923156893331?text=Hi!%20I%20found%20you%20through%20otherdev.com%20and%20would%20love%20to%20discuss%20a%20project."
                    target="_blank"
                    rel="noopener noreferrer"
                    data-slot="nav-item"
                  >
                    whatsapp
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tablet/Desktop Navigation */}
      {!isAIVariant && (
        <div className="hidden sm:flex items-center gap-1.5 pointer-events-auto">
          <Button
            asChild
            variant="nav"
            size="nav-default"
            className={pathname === "/" ? "text-foreground" : ""}
          >
            <Link href="/" data-slot="nav-item">
              other dev
            </Link>
          </Button>

          <Button
            asChild
            variant="nav"
            size="nav-default"
            className={pathname?.startsWith("/work") ? "text-foreground" : ""}
          >
            <Link href="/work" data-slot="nav-item">
              work
            </Link>
          </Button>

          <Button
            asChild
            variant="nav"
            size="nav-default"
            className={pathname?.startsWith("/about") ? "text-foreground" : ""}
          >
            <Link href="/about" data-slot="nav-item">
              about
            </Link>
          </Button>

          <Button
            asChild
            variant="nav"
            size="nav-default"
            className={pathname?.startsWith("/loom") ? "text-foreground" : ""}
          >
            <Link href="/loom" data-slot="nav-item">
              ai
            </Link>
          </Button>

          <Button
            asChild
            variant="nav"
            size="nav-default"
            className={pathname === "/work/ads-portfolio" ? "text-foreground" : ""}
          >
            <Link href="/work/ads-portfolio" data-slot="nav-item">
              ads
            </Link>
          </Button>

          {/* <Button
            variant="nav"
            size="nav-default"
            onClick={handleContactClick}
            data-slot="nav-item"
          >
            Contact
          </Button> */}

          <Button asChild variant="nav" size="nav-default">
            <Link
              href="https://wa.me/923156893331?text=Hi!%20I%20found%20you%20through%20otherdev.com%20and%20would%20love%20to%20discuss%20a%20project."
              target="_blank"
              rel="noopener noreferrer"
              data-slot="nav-item"
            >
              whatsapp
            </Link>
          </Button>
        </div>
      )}

      {/* Clear Chat Button */}
      {isLoomPage && onClear && !hasActiveArtifact && (
        <Button
          variant="nav"
          size="nav-default"
          onClick={onClear}
          className="absolute right-3 top-0 pointer-events-auto bg-red-50/70 text-red-600 hover:text-red-700 hover:bg-red-100/70 flex items-center gap-1.5"
        >
          <Trash2 size={12} strokeWidth={2} />
          clear
        </Button>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 z-30 -backdrop-blur-lg pointer-events-none",
            isAIVariant ? "" : "sm:hidden",
          )}
        />
      )}

      {/* Contact Dialog */}
      <ContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
      />
    </nav>
  );
}
