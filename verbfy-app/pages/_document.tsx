import { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentContext, DocumentInitialProps } from 'next/document';
import Document from 'next/document';

/**
 * Custom Document with CSP nonce support
 *
 * Note: Nonces only work in SSR mode, not in static export mode.
 * For static export, Next.js config uses hash-based CSP as fallback.
 */
class VerbfyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps & { nonce?: string }> {
    const initialProps = await Document.getInitialProps(ctx);

    // Generate nonce for CSP (only in SSR mode)
    // In static export mode, this will be undefined
    const nonce = ctx.res?.getHeader?.('X-CSP-Nonce') as string | undefined;

    return {
      ...initialProps,
      nonce: nonce || undefined,
    };
  }

  render() {
    const { nonce } = this.props as any;

    return (
      <Html lang="en" data-scroll-behavior="smooth">
        <Head nonce={nonce}>
          <meta charSet="utf-8" />
          {/* PWA Meta Tags */}
          <meta name="theme-color" content="#3b82f6" />
          <meta name="application-name" content="Verbfy" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Verbfy" />
          <meta name="description" content="Learn languages with AI-powered tutoring and live conversations" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="msapplication-TileColor" content="#3b82f6" />
          <meta name="msapplication-tap-highlight" content="no" />

          {/* Permissions Policy for WebRTC media access */}
          <meta httpEquiv="Permissions-Policy" content="camera=*, microphone=*, display-capture=*, geolocation=(), payment=(), usb=()" />

          {/* Feature Policy (fallback for older browsers) */}
          <meta httpEquiv="Feature-Policy" content="camera *; microphone *; display-capture *" />

          {/* PWA Manifest */}
          <link rel="manifest" href="/manifest.json" />

          {/* Favicons and Icons */}
          <link rel="icon" type="image/svg+xml" href="/icons/icon-192x192.svg" />
          <link rel="shortcut icon" href="/icons/icon-192x192.svg" />
          <link rel="apple-touch-icon" href="/icons/icon-152x152.svg" />
          <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.svg" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        </Head>
        <body className="antialiased">
          <Main />
          <NextScript nonce={nonce} />
        </body>
      </Html>
    );
  }
}

export default VerbfyDocument;