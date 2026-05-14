import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://proart-od13mipwc-juan-s-projects5.vercel.app/sitemap.xml",
  };
}