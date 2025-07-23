/**
 * KKAPI Protocol Adapter for Node.js Testing
 * 
 * Patches global fetch to handle kkapi:// protocol by rewriting URLs
 * to http://localhost:1646 for testing environments.
 * 
 * In production Tauri environments, kkapi:// is handled by the 
 * register_uri_scheme_protocol handler.
 */

export function installKkapiAdapter(
  origin = 'http://localhost:1646'
): void {
  const originalFetch = global.fetch;
  
  global.fetch = ((input: any, init?: any) => {
    let url: string;
    
    if (typeof input === 'string') {
      url = input;
    } else if (input && typeof input.url === 'string') {
      url = input.url;
    } else if (input && input.href) {
      url = input.href;
    } else {
      // If we can't determine the URL, pass through unchanged
      return originalFetch(input, init);
    }

    // Rewrite kkapi:// URLs to HTTP localhost
    if (url.startsWith('kkapi://')) {
      const rewrittenUrl = url.replace(/^kkapi:\/\//, `${origin}/`);
      console.log(`🔄 [KKAPI ADAPTER] Rewriting: ${url} → ${rewrittenUrl}`);
      
      if (typeof input === 'string') {
        return originalFetch(rewrittenUrl, init);
      } else {
        // For Request objects, create a new one with the rewritten URL
        const newRequest = new Request(rewrittenUrl, input);
        return originalFetch(newRequest, init);
      }
    }
    
    // Pass through non-kkapi URLs unchanged
    return originalFetch(input, init);
  }) as typeof fetch;
  
  console.log('✅ [KKAPI ADAPTER] Installed global fetch adapter for kkapi:// protocol');
}

// Auto-install the adapter when this module is imported
installKkapiAdapter(); 