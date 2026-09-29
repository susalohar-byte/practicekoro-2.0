/**
 * SEO Head component.
 *
 * Manages dynamic <title>, <meta>, and Open Graph tags for any page
 * using react-helmet-async.
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article';
  locale?: string;
  noindex?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  url,
  image = 'https://practicekoro.online/logo.png',
  type = 'website',
  locale = 'bn_IN',
  noindex = false,
}) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    {noindex && <meta name="robots" content="noindex, nofollow" />}
    {url && <link rel="canonical" href={url} />}

    {/* Open Graph */}
    <meta property="og:type" content={type} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    {url && <meta property="og:url" content={url} />}
    <meta property="og:image" content={image} />
    <meta property="og:locale" content={locale} />
    <meta property="og:site_name" content="PracticeKoro" />

    {/* Twitter Card */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={image} />
  </Helmet>
);
