/**
 * SEO JSON-LD component.
 *
 * Renders a <script type="application/ld+json"> tag in the document <head>
 * via react-helmet-async. Google and other crawlers parse this for rich
 * snippet data.
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

interface JsonLdProps {
  data: object;
}

export const JsonLd: React.FC<JsonLdProps> = ({ data }) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify(data)}</script>
  </Helmet>
);
