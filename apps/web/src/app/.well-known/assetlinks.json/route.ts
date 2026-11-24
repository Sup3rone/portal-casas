// T-5243: Digital Asset Links. Android lo lee para confiar en el APK (TWA) y abrir el sitio SIN barra de navegador.
// La huella SHA-256 del certificado de firma va en ANDROID_CERT_SHA256 (Vercel), varias separadas por coma; nunca en
// el código. Sin una huella válida → 404: mejor «sin vínculo» que uno vacío. Lleva punto: el proxy no la toca.
import { NextResponse } from 'next/server';

/** Debe coincidir con `packageId` de android/twa-manifest.json (lo revisa scripts/test-assetlinks.cjs). */
export const ANDROID_PACKAGE = 'com.aliaforrent.app';

export const dynamic = 'force-dynamic';

const FINGERPRINT = /^[0-9A-F]{2}(?::[0-9A-F]{2}){31}$/;

export function GET() {
  const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? '').split(',').map(value => value.trim().toUpperCase()).filter(value => FINGERPRINT.test(value));
  if (fingerprints.length === 0) return new NextResponse(null, { status: 404 });
  return NextResponse.json([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: ANDROID_PACKAGE, sha256_cert_fingerprints: fingerprints },
  }], { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
