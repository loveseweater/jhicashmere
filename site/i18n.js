(function () {
  // Public storefront stays English-only.
  const locale = "en";

  const dict = {
    en: {
      catalog: "Catalog",
      journal: "Journal",
      social: "Social",
      amazon: "Amazon",
      whatsapp: "WhatsApp",
      heroEyebrow: "JINHEXI Cashmere",
      socialEyebrow: "Social",
      contactEyebrow: "Contact",
      shopSiteStyles: "Shop exclusives",
      seeAmazonStyles: "Amazon edit",
      chatNow: "Chat now",
      browseCatalog: "Shop collection",
      openJournal: "Read journal",
      backToHome: "Back to home",
      backToPosts: "Back to posts",
      directSite: "Site Exclusives",
      ownStyles: "Independent styles",
      amazonTraffic: "Amazon-linked collection",
      quickContact: "Quick contact",
      productCatalog: "Product Catalog",
      categoryBrowsing: "Browse by category",
      catalogNote: "Browse sweaters, cardigans, scarves, gloves, and accessories in one clean edit.",
      seoJournal: "SEO Journal",
      postsAndArticles: "Posts and articles",
      journalNote: "Use these for care notes, styling content, and search visibility.",
      socialPlatforms: "Social platforms",
      contactTitle: "Start on WhatsApp.",
      contactText: "JINHEXI updates Amazon and direct-site ranges regularly. Reach out for products, wholesale, or partnerships.",
      journalIntro: "Publish care guides, style notes, and brand stories here so the site can rank for product-intent and education keywords.",
      loadingProduct: "Loading product",
      noProductsYet: "No products yet",
      noProductsHint: "Add products in the admin panel first.",
      readMore: "Read more",
      all: "All",
      noProducts: "No products in this category yet.",
      noProductsNote: "Add one in the admin panel or switch categories.",
      productDetail: "Product detail",
      exclusiveSite: "Exclusive to JINHEXI",
      amazonCollection: "Amazon Collection",
      bothChannels: "Amazon + Site",
      amazonComingSoon: "Amazon Coming Soon",
      viewDetails: "View details",
      viewOnAmazon: "View on Amazon",
      productBrief: "Product Brief",
      relatedPieces: "Related Pieces",
      moreToExplore: "More to explore",
      relatedPiecesNote: "Continue the edit with similar knitwear and accessories.",
      relatedPosts: "Related Posts",
      moreReading: "More reading",
      relatedPostsNote: "Continue with care, styling, and merchandising notes.",
      listingBriefNote: "Simplified Amazon-style listing fields maintained in the admin panel.",
      coreBullets: "Core selling points",
      buyerNeeds: "Key details",
      productIntro: "Product introduction",
      backToCatalog: "Back to catalog",
      whatsappInquiry: "WhatsApp Inquiry",
      colors: "Colors",
      material: "Material",
      size: "Size",
      fit: "Fit",
      care: "Care",
      occasion: "Occasion",
      keywords: "Keywords",
      status: "Status"
    }
  };

  const t = (key) => (dict[locale] && dict[locale][key]) || dict.en[key] || key;

  window.JINHEXI_I18N = { locale, t };
  document.documentElement.lang = "en";
})();
