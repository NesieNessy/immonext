import { NextRequest, NextResponse } from 'next/server';

type OpenPlzLocality = {
  postalCode?: string;
  name?: string;
  federalState?: {
    key?: string;
    name?: string;
  };
};

export async function GET(request: NextRequest) {
  const postalCode = request.nextUrl.searchParams.get('postalCode')?.trim() ?? '';

  if (!/^\d{5}$/.test(postalCode)) {
    return NextResponse.json(
      { error: 'Bitte eine fünfstellige deutsche Postleitzahl eingeben.' },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://openplzapi.org/de/Localities?postalCode=${encodeURIComponent(postalCode)}`,
      {
        headers: { Accept: 'text/json' },
        next: { revalidate: 60 * 60 * 24 * 30 },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      throw new Error(`OpenPLZ antwortete mit Status ${response.status}.`);
    }

    const localities = await response.json() as OpenPlzLocality[];
    const cityNames = Array.from(new Set(
      localities
        .filter((locality) => locality.postalCode === postalCode)
        .map((locality) => locality.name?.trim())
        .filter((name): name is string => Boolean(name)),
    )).sort((a, b) => a.localeCompare(b, 'de'));
    const federalState = localities.find((locality) => locality.federalState?.name)?.federalState ?? null;

    return NextResponse.json({
      postalCode,
      cities: cityNames,
      federalState: federalState
        ? { key: federalState.key ?? '', name: federalState.name ?? '' }
        : null,
    });
  } catch (error) {
    console.error('Postal-code lookup failed:', error);
    return NextResponse.json(
      { error: 'Der Ort konnte derzeit nicht automatisch ermittelt werden.' },
      { status: 502 },
    );
  }
}
