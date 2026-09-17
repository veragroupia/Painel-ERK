export function orderCostTotal(c: { silverGrams: number; silverPricePerGram: number; laborCost: number; polishCost: number; packagingCost: number; clampCost: number; thirdPartyCost: number }) {
  return c.silverGrams * c.silverPricePerGram + c.laborCost + c.polishCost + c.packagingCost + c.clampCost + c.thirdPartyCost;
}

export function productCostTotal(p: { costSilverGrams: number; costLaborValue: number; costPackaging: number; costThirdParty: number }, silverPricePerGram: number, suppliesCost = 0) {
  return p.costSilverGrams * silverPricePerGram + p.costLaborValue + p.costPackaging + p.costThirdParty + suppliesCost;
}

export function marginPct(price: number, cost: number): number {
  if (price <= 0) return 0;
  return ((price - cost) / price) * 100;
}

export function variacaoPct(atual: number, anterior: number): number {
  if (anterior === 0) return atual === 0 ? 0 : 100;
  return ((atual - anterior) / anterior) * 100;
}
