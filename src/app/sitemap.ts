import { promises as fs, readdirSync } from "fs";
import path from "path";

const SITE_URL = "https://next-mdx-blog.vercel.app";

async function getNoteSlugs(dir: string) {
  const entries = await fs.readdir(dir, {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isFile() && entry.name === "page.mdx")
    .map((entry) => {
      const relativePath = path.relative(
        dir,
        path.join(entry.parentPath, entry.name)
      );
      return path.dirname(relativePath);
    })
    .map((slug) => slug.replace(/\\/g, "/"));
}

const isDynamicRoute = (routePath: string): boolean => {
  return routePath.includes("[") && routePath.includes("]");
};

const pathsToIgnore = ["humans/[id]", "careers/[slug]"];

const scanRoutes = (dir: string) => {
  const entries = readdirSync(dir, {
    recursive: true,
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isFile() && entry.name === "page.tsx")
    .filter((entry) => {
      const fullPath = path.join(entry.parentPath, entry.name);
      const relativePath = path.relative(dir, path.dirname(fullPath));
      return !pathsToIgnore.includes(relativePath);
    })
    .map((entry) => {
      const fullPath = path.join(entry.parentPath, entry.name);
      const routePath = path.relative(dir, path.dirname(fullPath));

      if (isDynamicRoute(routePath)) {
        const routeBase = routePath.split("/")[0];

        let dynamicPages: string[] = [];
        try {
          const directoryPath = path.join(process.cwd(), routeBase);
          dynamicPages = readdirSync(directoryPath)
            .filter((file) => path.extname(file) === ".mdx")
            .map((item) => item.replace(".mdx", ""));
        } catch (error) {
          console.error(error);
        }

        return dynamicPages.map((slug) => ({
          url: `https://resend.com/${routeBase}/${slug}`,
          lastModified: new Date().toISOString(),
        }));
      }

      return {
        url: `https://resend.com/${routePath}`,
        lastModified: new Date().toISOString(),
      };
    });
};

export default async function sitemap() {
  const notesDirectory = path.join(process.cwd(), "src", "app", "n");

  const slugs = await getNoteSlugs(notesDirectory);

  const notes = slugs.map((slug) => ({
    url: `${SITE_URL}/n/${slug}`,
    lastModified: new Date().toISOString(),
  }));

  const routes = ["", "/work"].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date().toISOString(),
  }));

  const pagesDir = path.join(process.cwd(), "src", "app", "(website)");
  const newRoutes = scanRoutes(pagesDir);

  return [...routes, ...notes, ...newRoutes.flat()];
}
