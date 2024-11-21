const query =
    `mutation {
      metafieldsSet(metafields: [
        {
          namespace: "product_data",
          key: "volume_discount",
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
