import { createNavigation } from "next-intl/navigation";
import { routing } from "./config";

export const {
  Link,
  redirect,
  permanentRedirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);
