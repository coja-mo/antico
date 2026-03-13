import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET — generate wallet pass data for Apple/Google Wallet
export async function GET(request, { params }) {
  try {
    const db = getDb();
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'apple';

    const card = db.prepare('SELECT * FROM gift_cards WHERE code = ?').get(code);
    if (!card) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    if (type === 'google') {
      // Google Wallet pass object
      const passObject = {
        iss: 'antico-ristorante',
        aud: 'google',
        typ: 'savetowallet',
        iat: Math.floor(Date.now() / 1000),
        origins: [],
        payload: {
          genericObjects: [{
            id: `antico-gc-${card.code}`,
            classId: 'antico-gift-card',
            genericType: 'GENERIC_GIFT_CARD',
            hexBackgroundColor: '#0a0a0a',
            logo: { sourceUri: { uri: 'https://antico-ristorante.com/images/antico-logo-transparent.png' } },
            cardTitle: { defaultValue: { language: 'en', value: 'Antico Ristoranté' } },
            subheader: { defaultValue: { language: 'en', value: 'Gift Card' } },
            header: { defaultValue: { language: 'en', value: `$${card.balance.toFixed(2)}` } },
            barcode: {
              type: 'QR_CODE',
              value: card.code,
              alternateText: card.code,
            },
            textModulesData: [
              { id: 'balance', header: 'Balance', body: `$${card.balance.toFixed(2)}` },
              { id: 'code', header: 'Card Code', body: card.code },
              { id: 'recipient', header: 'For', body: card.recipient_name || 'Valued Guest' },
            ],
          }],
        },
      };

      return NextResponse.json({
        type: 'google',
        passData: passObject,
        // In production, this would be a signed JWT URL
        saveUrl: `https://pay.google.com/gp/v/save/antico-gc-${card.code}`,
      });
    }

    // Apple Wallet pass structure (would need signing with Apple cert in production)
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: 'pass.com.antico.giftcard',
      serialNumber: card.code,
      teamIdentifier: 'ANTICO',
      organizationName: 'Antico Ristoranté',
      description: 'Antico Gift Card',
      logoText: 'Antico Ristoranté',
      foregroundColor: 'rgb(245, 240, 232)',
      backgroundColor: 'rgb(10, 10, 10)',
      labelColor: 'rgb(212, 168, 75)',
      barcode: {
        message: card.code,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: card.code,
      },
      storeCard: {
        headerFields: [
          { key: 'balance', label: 'BALANCE', value: `$${card.balance.toFixed(2)}`, currencyCode: 'CAD' },
        ],
        primaryFields: [
          { key: 'amount', label: 'Gift Card', value: `$${card.balance.toFixed(2)}` },
        ],
        secondaryFields: [
          { key: 'code', label: 'CARD CODE', value: card.code },
        ],
        auxiliaryFields: [
          { key: 'recipient', label: 'FOR', value: card.recipient_name || 'Valued Guest' },
        ],
        backFields: [
          { key: 'info', label: 'About This Card', value: 'This gift card can be redeemed at Antico Ristoranté. Present the QR code at checkout.' },
          { key: 'location', label: 'Location', value: '6 Village Court, Sault Ste. Marie, ON' },
          { key: 'phone', label: 'Contact', value: '705-255-0161' },
        ],
      },
    };

    return NextResponse.json({
      type: 'apple',
      passData,
      // Note: In production, this would generate and serve a signed .pkpass file
      note: 'Apple Wallet pass requires signing with an Apple Developer certificate for production use.',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
