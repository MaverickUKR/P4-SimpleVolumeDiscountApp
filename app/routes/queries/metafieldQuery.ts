const query =
    `mutation {
      metafieldsSet(metafields: [
        {
          namespace: "discount_data",
          key: "volumes_discounts",
          type: "string",
          value: "${metafieldValue}",
          ownerId: "${productId}"
        }
      ]) {
        userErrors {
          field
          message
        }
        metafields {
          id
          namespace
          key
          value
        }
      }
    }`
  ;
