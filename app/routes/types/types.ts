export type DiscountLevel = {
  volume: string;       // количество товара для скидки
  discountType: string; // тип скидки (например, % или фиксированная сумма)
  discount: string;     // величина скидки
  description: string;  // описание уровня скидки
  label: string;        // метка уровня скидки
};

export type Product = {
  id: string;  // уникальный идентификатор продукта
  name: string; // название продукта
};
