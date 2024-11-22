import React, { useState, useEffect } from "react";

type DiscountLevel = {
  volume: number;
  discount: number;
  label: string;
};

type SavingsChartWidgetProps = {
  discountLevels: DiscountLevel[];
};

const SavingsChartWidget: React.FC<SavingsChartWidgetProps> = ({
  discountLevels,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [maxVolume, setMaxVolume] = useState(1);

  useEffect(() => {
    const maxDiscountVolume =
      discountLevels[discountLevels.length - 1]?.volume || 1;
    setMaxVolume(maxDiscountVolume);
  }, [discountLevels]);

  const handleQuantityChange = (value: string) => {
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue) && parsedValue > 0 && parsedValue <= maxVolume) {
      setQuantity(parsedValue);
    }
  };

  return (
    <div
      style={{
        background: "repeating-linear-gradient(45deg, #ffffff, #ffffff 10px, #f7f7f7 10px, #f7f7f7 20px)",
        padding: "20px 80px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Quantity Selector */}
      <div
         style={{ margin: "20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}
       >
       {/* Widget Preview Header */}
       <h2 style={{ marginBottom: "20px", fontWeight: "bold" }}>Widget preview</h2>
       <div style={{ position: "relative", display: "inline-block" }}>
      <span
        style={{
          position: "absolute",
          left: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          fontSize: "14px",
          color: "#999",
        }}
      >
    volumes:
  </span>
  <input
    type="number"
    value={quantity}
    onChange={(e) => handleQuantityChange(e.target.value)}
    min={1}
    max={maxVolume}
    style={{
      paddingTop: "5px",
      paddingBottom: "5px",
      paddingLeft: "80px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      minWidth: "20vw",
      lineHeight: "inherit",
    }}
  />
</div>

      </div>
      <div>
        {/* Savings Chart */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px"
          }}
        >

          <h3>Savings Chart</h3>
          <h3>* in cart</h3>


        </div>
        <div
          style={{
            width: "100%",
            position: "relative",
            height: "30px",
            background: "#eaeaea",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.min(15 + ((quantity - 1) / (maxVolume - 1)) * 85, 100)}%`, // Пропорция от 85% после первого отрезка
              minWidth: "15%", // Первый отрезок фиксирован на 15%
              background: "grey",
              // textAlign: "center",
              alignItems: "center",
              color: "white",
              fontWeight: "bold",
              lineHeight: "40px",
              height: "100%",
              position: "absolute",
              left: 0,
              top: 0,
              paddingLeft: 10,
              display: "flex",
            }}
          >
            QUANTITY: {quantity}
          </div>
          {/* Discount Markers */}
          {discountLevels.map((level, index) => (
            <React.Fragment key={level.volume}>
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${
                  15 + ((level.volume - 1) / (maxVolume - 1)) * 85 // Расчет позиции с учетом первых 15%
                }%`,
                top: 0,
                height: "100%",
                width: "2px",
                background: "black",
                transform: "translateX(-50%)",
              }}
            />

          <div
          style={{
            position: "absolute",
            top: 0,
            left: `${
              15 + ((level.volume - 1) / (maxVolume - 1)) * 85 // Расчет позиции с учетом первых 15%
            }%`,
            width: "50%",
            display: "flex",
            justifyContent: "space-between",
            padding: "0 10px",
            alignItems: "center",
            height: "100%",
            pointerEvents: "none",
          }}
        >
            <span
              key={index}
              style={{
                left: `${
                  15 + ((level.volume - 1) / (maxVolume - 1)) * 85 // Расчет позиции с учетом первых 15%
                }%`,
                width: "40%",
                maxWidth: "100%",
                fontSize: "12px",
                fontWeight: "bold",
                color: "#333",
                textAlign: "center",
              }}
            >
              {level.label}
            </span>
        </div>
         </React.Fragment>
          ))}
        </div>
      </div>

      {/* Discounts Table */}
      <table
        style={{
          width: "100%",
          textAlign: "center",
          border: "1px solid #ddd",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f9f9f9" }}>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>
              Quantity
            </th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>
              Discount per item
            </th>
          </tr>
        </thead>
        <tbody>
          {discountLevels
            .filter((level) => level.volume > 0) // Фильтруем уровни с volume = 0
            .map((level, index) => (
              <tr key={level.volume}>
                <td style={{ border: "1px solid #ddd", padding: "8px", background: "white" }}>
                  {level.volume}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px", background: "white" }}>
                  {level.label}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default SavingsChartWidget;
