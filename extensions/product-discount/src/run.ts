// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 * @typedef {import("../generated/api").Target} Target
 */

/**
 * Константа для возврата пустой скидки.
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * Парсит строку метафилда и возвращает массив объемов и скидок.
 * @param {string} metafieldValue
 * @returns {{ volumes: number[], discounts: number[] }}
 */
function parseMetafield(metafieldValue: string) {
  const [volumesPart, discountsPart] = metafieldValue.split("Discounts:");
  const volumes = volumesPart
    .replace("Volumes:", "")
    .split(",")
    .map(Number);
  const discounts = discountsPart.split(",").map(Number);
  return { volumes, discounts };
}

/**
 * @param {number} quantity
 * @param {number[]} volumes
 * @param {number[]} discounts
 * @returns {number}
 */
function calculateDiscount(quantity, volumes, discounts) {
  let discount = 0;

  for (let i = 0; i < volumes.length - 1; i++) {
    if (quantity >= volumes[i]) {
      discount = discounts[i];
    } else {
      console.log(`Quantity ${quantity} is less than ${volumes[i]} on iteartion ${i}`);
      break
    }
  }
  console.log(`Discount is ${discount}`);
  return discount;
}

/**
 * Основная функция расчета скидок.
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const discounts = [];

  input.cart.lines.forEach((line) => {
    const metafield = line.merchandise?.product?.metafield?.value;

    // Пропускаем строки без метафилда или с пустым значением
    if (!metafield || metafield.trim() === "") {
      console.error(`Skipping line ${line.id}: Metafield is missing or empty.`);
      return;
    }

    try {
      // Парсим метафилд
      const { volumes, discounts: discountValues } = parseMetafield(metafield);

      // Рассчитываем скидку
      const discountPercentage = calculateDiscount(
        line.quantity,
        volumes,
        discountValues
      );

      if (discountPercentage > 0) {
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
              value: discountPercentage.toString(),
            },
          },
        });
      }
    } catch (error) {
      console.error(
        `Error processing metafield for line ${line.id}:`,
        error.message
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

// // @ts-check
// import { DiscountApplicationStrategy } from "../generated/api";

// // Use JSDoc annotations for type safety
// /**
//  * @typedef {import("../generated/api").RunInput} RunInput
//  * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
//  * @typedef {import("../generated/api").Target} Target
//  * @typedef {import("../generated/api").ProductVariant} ProductVariant
//  */

// /**
//  * @type {FunctionRunResult}
//  */
// const EMPTY_DISCOUNT = {
//   discountApplicationStrategy: DiscountApplicationStrategy.First,
//   discounts: [],
// };
// /**
//  * @param {RunInput} input
//  * @returns {FunctionRunResult}
//  */
// export function run(input) {
//   const targets = input.cart.lines
//     // Only include cart lines with a quantity of two or more
//     .filter((line) => line.quantity >= 2)
//     .map((line) => {
//       return /** @type {Target} */ ({
//         // Use the cart line ID to create a discount target
//         cartLine: {
//           id: line.id,
//         },
//       });
//     });
//   if (!targets.length) {
//     // You can use STDERR for debug logs in your function
//     console.error("No cart lines qualify for volume discount.");
//     return EMPTY_DISCOUNT;
//   }

//   return {
//     discounts: [
//       {
//         // Apply the discount to the collected targets
//         targets,
//         // Define a percentage-based discount
//         value: {
//           percentage: {
//             value: "10.0",
//           },
//         },
//       },
//     ],
//     discountApplicationStrategy: DiscountApplicationStrategy.First,
//   };
// }
