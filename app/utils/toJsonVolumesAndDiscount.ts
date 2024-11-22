interface VolumeDiscount {
  volume: string;
  discount: string;
}

export function toJsonVolumeAndDiscount(data: VolumeDiscount[]): { metafieldValue: Record<string, string[]> } {
  const volumes = data.map(item => item.volume);
  const discounts = data.map(item => item.discount);

  const metafieldValue = {
    Volumes: volumes,
    Discounts: discounts,
  };

  return {
    metafieldValue,
  };
}
