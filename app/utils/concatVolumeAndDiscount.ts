//source/app/utils/concatVolumeAndDiscount.ts
interface VolumeDiscount {
  volume: string;
  discount: string;
}

export function concatenateVolumeAndDiscount(data: VolumeDiscount[]): { metafieldValue: string } {
  const volumes = data.map(item => item.volume).join(',');
  const discounts = data.map(item => item.discount).join(',');
  const metafieldValue = "Volumes:" + volumes + ",Discounts:" + discounts;
  return {
    metafieldValue
  };
}
