import { DiscountApplicationStrategy } from "../generated/api";
import type { Discount, FunctionRunResult, RunInput } from "../generated/api";

const EMPTY_DISCOUNT: FunctionRunResult = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

export function run(input: RunInput): FunctionRunResult {
  const discounts: Discount[] = [];

  input.cart.lines.forEach((line) => {
    const metafield = line.merchandise?.product?.metafield?.value;

    if (!metafield || metafield.trim() === "") {
      console.error(`Skipping line ${line.id}: Metafield is missing or empty.`);
      return;
    }

    try {
      const { Volumes, Discounts } = JSON.parse(metafield);

      if (!Array.isArray(Volumes) || !Array.isArray(Discounts)) {
        console.error(
          `Skipping line ${line.id}: Invalid metafield format.`,
          metafield
        );
        return;
      }

      let applicableDiscount = 0;
      for (let i = 0; i < Volumes.length; i++) {
        if (line.quantity >= Volumes[i]) {
          applicableDiscount = Discounts[i];
        } else {
          break;
        }
      }

      if (applicableDiscount > 0) {
        discounts.push({
          targets: [
            {
              cartLine: {
                id: line.id,
              },
            },
          ],
          value: {
            percentage: {
              value: applicableDiscount.toString(),
            },
          },
        });
      }
    } catch (error) {
      console.error(
        `Error processing metafield for line ${line.id}:`,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  });

  if (!discounts.length) {
    console.error("No discounts applied.");
    return EMPTY_DISCOUNT;
  }

  return {
    discounts,
    discountApplicationStrategy: DiscountApplicationStrategy.First,
  };
}
