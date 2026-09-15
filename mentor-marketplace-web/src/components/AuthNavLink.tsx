import { MouseEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { navigateRequiringAuth } from "@/lib/postAuthRedirect";

type AuthNavLinkProps = {
  to: string;
  children: ReactNode;
  className?: string;
  authPath?: "/login" | "/signup";
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

/** Link that requires sign-in before visiting `to`; otherwise goes to login/signup. */
export function AuthNavLink({
  to,
  children,
  className,
  authPath = "/login",
  onClick,
}: AuthNavLinkProps) {
  const navigate = useNavigate();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }
    event.preventDefault();
    navigateRequiringAuth(navigate, to, { authPath });
  }

  return (
    <Link to={to} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
