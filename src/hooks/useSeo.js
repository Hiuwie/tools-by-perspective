import { useEffect } from 'react';

const DEFAULT_SITE_NAME = 'Perspective POV Tools';
const DEFAULT_DESCRIPTION =
  'Free browser-based PDF tools to organize, reorder, rotate, sign, and export documents quickly.';
const DEFAULT_IMAGE = '/Icons/PDFIcon.svg';

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useSeo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_IMAGE,
  robots = 'index,follow',
}) {
  useEffect(() => {
    const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://tools.perspectivepov.co.za').replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const canonicalUrl = `${siteUrl}${normalizedPath}`;
    const pageTitle = title ? `${title} | ${DEFAULT_SITE_NAME}` : DEFAULT_SITE_NAME;

    document.title = pageTitle;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);

    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', DEFAULT_SITE_NAME);
    upsertMeta('property', 'og:title', pageTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', image.startsWith('http') ? image : `${siteUrl}${image}`);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', pageTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image.startsWith('http') ? image : `${siteUrl}${image}`);

    upsertLink('canonical', canonicalUrl);
  }, [title, description, path, image, robots]);
}

