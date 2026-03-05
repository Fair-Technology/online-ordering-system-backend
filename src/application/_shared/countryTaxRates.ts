import { ShopTaxRate } from '../../domain/shop/Shop';

type TaxRateSeed = { label: string; rate: number };

const TAX_RATE_SEEDS: Record<string, TaxRateSeed[]> = {
  AU: [
    { label: 'GST (10%)', rate: 0.1 },
    { label: 'GST-free (0%)', rate: 0 },
  ],
  NZ: [
    { label: 'GST (15%)', rate: 0.15 },
    { label: 'Zero (0%)', rate: 0 },
  ],
  DE: [
    { label: 'Standard (19%)', rate: 0.19 },
    { label: 'Reduced (7%)', rate: 0.07 },
    { label: 'Zero (0%)', rate: 0 },
  ],
  AT: [
    { label: 'Standard (20%)', rate: 0.2 },
    { label: 'Reduced (10%)', rate: 0.1 },
    { label: 'Zero (0%)', rate: 0 },
  ],
  FR: [
    { label: 'Standard (20%)', rate: 0.2 },
    { label: 'Intermediate (10%)', rate: 0.1 },
    { label: 'Reduced (5.5%)', rate: 0.055 },
    { label: 'Zero (0%)', rate: 0 },
  ],
  NL: [
    { label: 'Standard (21%)', rate: 0.21 },
    { label: 'Reduced (9%)', rate: 0.09 },
    { label: 'Zero (0%)', rate: 0 },
  ],
  GB: [
    { label: 'Standard (20%)', rate: 0.2 },
    { label: 'Reduced (5%)', rate: 0.05 },
    { label: 'Zero (0%)', rate: 0 },
  ],
  CH: [
    { label: 'Standard (8.1%)', rate: 0.081 },
    { label: 'Reduced (2.6%)', rate: 0.026 },
    { label: 'Zero (0%)', rate: 0 },
  ],
  US: [], // State-level — owner adds manually
  CA: [
    { label: 'GST (5%)', rate: 0.05 },
    { label: 'Zero (0%)', rate: 0 },
  ],
  SG: [
    { label: 'GST (9%)', rate: 0.09 },
    { label: 'Zero (0%)', rate: 0 },
  ],
  JP: [
    { label: 'Standard (10%)', rate: 0.1 },
    { label: 'Reduced (8%)', rate: 0.08 },
  ],
};

export function seedTaxRatesForCountry(countryCode: string): ShopTaxRate[] {
  const seeds = TAX_RATE_SEEDS[countryCode.toUpperCase()];
  if (seeds === undefined) {
    // Unknown country — seed a single zero rate as a safe default
    return [{ id: crypto.randomUUID(), label: 'No Tax (0%)', rate: 0 }];
  }
  return seeds.map((s) => ({ id: crypto.randomUUID(), label: s.label, rate: s.rate }));
}
