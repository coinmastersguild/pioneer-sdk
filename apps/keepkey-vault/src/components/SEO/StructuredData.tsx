'use client'

import React from 'react';

export const ProductStructuredData = () => {
  const productData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "KeepKey Vault",
    "description": "Secure cryptocurrency wallet management with KeepKey hardware wallet",
    "applicationCategory": "Finance",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "publisher": {
      "@type": "Organization",
      "name": "KeepKey"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productData) }}
    />
  );
};

export const OrganizationStructuredData = () => {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "KeepKey",
    "url": "https://keepkey.com",
    "logo": "https://keepkey.com/images/logos/keepkey-logo-square.png",
    "description": "Leading hardware wallet manufacturer for secure cryptocurrency storage"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
    />
  );
};

export const SoftwareApplicationStructuredData = () => {
  const softwareData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "KeepKey Vault",
    "applicationCategory": "Finance",
    "operatingSystem": "Web Browser",
    "description": "Secure cryptocurrency wallet management interface for KeepKey hardware wallets",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareData) }}
    />
  );
}; 