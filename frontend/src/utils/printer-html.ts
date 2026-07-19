import { formatCurrency, type DeliveryReceiptData } from "./printer";

function formatReceiptCurrency(value?: string | number | null) {
  const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
  return formatCurrency(numValue).replace(/^Rs\.\s*/, "₹");
}

type ReceiptExportItem = {
  itemName: string;
  quantityText: string;
  lineTotal: string;
};

type ReceiptExportPayload = {
  companyName: string;
  shopName: string;
  mobileText: string;
  toText: string;
  buyerName: string;
  buyerShopName: string;
  openingBalanceLabel?: string;
  openingBalanceValue?: string;
  itemHeader: string;
  quantityHeader: string;
  totalHeader: string;
  cashLabel: string;
  cashValue: string;
  upiLabel: string;
  upiValue: string;
  totalLabel: string;
  totalValue: string;
  balanceAmountLabel?: string;
  balanceAmountValue?: string;
  closingBalanceLabel?: string;
  closingBalanceValue?: string;
  thankYou: string;
  poweredBy: string;
  provider: string;
  items: ReceiptExportItem[];
};

export function buildReceiptExportPayload(data: DeliveryReceiptData): ReceiptExportPayload {
  const items = data.items.map(item => ({
    itemName: item.name,
    quantityText: String(item.quantity),
    lineTotal: formatReceiptCurrency(item.total),
  }));

  return {
    companyName: data.agency_name || "Sree Hari Agencies",
    shopName: data.agency_address || "Namakkal",
    mobileText: `Mobile: ${data.agency_mobile || "N/A"}`,
    toText: "To:",
    buyerName: data.buyer_name,
    buyerShopName: data.buyer_address,
    openingBalanceLabel: "Opening Balance",
    openingBalanceValue: formatReceiptCurrency(data.opening_balance),
    itemHeader: "Item",
    quantityHeader: "Qty",
    totalHeader: "Total",
    items: items,
    totalLabel: "Total Bill Amount:",
    totalValue: formatReceiptCurrency(data.total_bill),
    cashLabel: "Cash Paid:",
    cashValue: formatReceiptCurrency(data.cash_collected),
    upiLabel: "UPI Paid:",
    upiValue: formatReceiptCurrency(data.upi_collected),
    balanceAmountLabel: "Balance Amount:",
    balanceAmountValue: formatReceiptCurrency(
      data.total_bill - data.cash_collected - data.upi_collected,
    ),
    closingBalanceLabel: "Closing Balance",
    closingBalanceValue: formatReceiptCurrency(data.closing_balance),
    thankYou: "Thank You",
    poweredBy: "Software Provided By",
    provider: "Durozen Technologies Pvt. Ltd.",
  };
}

function serializeReceiptExportPayload(payload: ReceiptExportPayload) {
  return JSON.stringify(payload)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}

function buildReceiptImageExportScript() {
  return `
        <script>
          (function () {
            function postMessage(payload) {
              if (!window.ReactNativeWebView || typeof window.ReactNativeWebView.postMessage !== "function") {
                return;
              }

              window.ReactNativeWebView.postMessage(JSON.stringify(payload));
            }

            async function waitForFonts() {
              if (!document.fonts || !document.fonts.ready) {
                return;
              }

              try {
                await document.fonts.ready;
              } catch {
                // Continue with system fallback fonts when the browser cannot fully resolve font readiness.
              }
            }

            function loadReceiptExportPayload() {
              var payloadNode = document.getElementById("receipt-export-data");
              if (!payloadNode || !payloadNode.textContent) {
                throw new Error("Receipt export payload is unavailable.");
              }

              return JSON.parse(payloadNode.textContent);
            }

            function setFont(context, size, weight) {
              context.font =
                String(weight) +
                " " +
                String(size) +
                'px "Noto Sans Tamil", "Nirmala UI", "Latha", Arial, Helvetica, sans-serif';
              context.textBaseline = "top";
              context.fillStyle = "#000000";
            }

            function getLineHeight(size, ratio) {
              return Math.ceil(size * ratio);
            }

            function wrapText(context, value, maxWidth) {
              var text = String(value || "").replace(/\\s+/g, " ").trim();
              if (!text) {
                return [""];
              }

              var words = text.split(" ");
              var lines = [];
              var current = "";

              function pushBrokenWord(word) {
                var chunk = "";
                for (var index = 0; index < word.length; index += 1) {
                  var candidate = chunk + word[index];
                  if (chunk && context.measureText(candidate).width > maxWidth) {
                    lines.push(chunk);
                    chunk = word[index];
                  } else {
                    chunk = candidate;
                  }
                }

                if (chunk) {
                  current = chunk;
                }
              }

              for (var i = 0; i < words.length; i += 1) {
                var word = words[i];
                if (!current) {
                  if (context.measureText(word).width <= maxWidth) {
                    current = word;
                  } else {
                    pushBrokenWord(word);
                  }
                  continue;
                }

                var candidateLine = current + " " + word;
                if (context.measureText(candidateLine).width <= maxWidth) {
                  current = candidateLine;
                  continue;
                }

                lines.push(current);
                if (context.measureText(word).width <= maxWidth) {
                  current = word;
                } else {
                  current = "";
                  pushBrokenWord(word);
                }
              }

              if (current) {
                lines.push(current);
              }

              return lines.length > 0 ? lines : [text];
            }

            function drawWrappedText(context, text, x, y, maxWidth, options) {
              setFont(context, options.size, options.weight);
              var lines = options.noWrap
                ? [String(text || "").trim()]
                : wrapText(context, text, maxWidth);
              var lineHeight = getLineHeight(options.size, options.lineHeightRatio || 1.3);

              for (var index = 0; index < lines.length; index += 1) {
                var line = lines[index];
                var drawX = x;

                if (options.align === "center") {
                  drawX = x + (maxWidth - context.measureText(line).width) / 2;
                } else if (options.align === "right") {
                  drawX = x + maxWidth - context.measureText(line).width;
                }

                context.fillText(line, drawX, y + index * lineHeight);
              }

              return {
                height: lines.length * lineHeight,
                lines: lines,
              };
            }

            function measureFittedTextHeight(context, text, maxWidth, options) {
              var size = options.size;
              var minSize = options.minSize || Math.max(12, Math.floor(size * 0.6));
              var line = String(text || "").trim();

              while (size > minSize) {
                setFont(context, size, options.weight);
                if (context.measureText(line).width <= maxWidth) {
                  break;
                }
                size -= 1;
              }

              return getLineHeight(size, options.lineHeightRatio || 1.3);
            }

            function drawFittedText(context, text, x, y, maxWidth, options) {
              var size = options.size;
              var minSize = options.minSize || Math.max(12, Math.floor(size * 0.6));
              var line = String(text || "").trim();
              var align = options.align || "right";

              while (size > minSize) {
                setFont(context, size, options.weight);
                if (context.measureText(line).width <= maxWidth) {
                  break;
                }
                size -= 1;
              }

              setFont(context, size, options.weight);
              var drawX = x;
              if (align === "right") {
                drawX = x + maxWidth - context.measureText(line).width;
              } else if (align === "center") {
                drawX = x + (maxWidth - context.measureText(line).width) / 2;
              }

              context.fillText(line, drawX, y);
              return getLineHeight(size, options.lineHeightRatio || 1.3);
            }

            function sliceCanvasToBase64Chunks(canvas) {
              var maxSliceHeight = 900;
              var chunks = [];
              var sliceTop = 0;

              while (sliceTop < canvas.height) {
                var sliceHeight = Math.min(maxSliceHeight, canvas.height - sliceTop);
                var sliceCanvas = document.createElement("canvas");
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = sliceHeight;

                var sliceContext = sliceCanvas.getContext("2d");
                if (!sliceContext) {
                  throw new Error("Canvas context is unavailable.");
                }

                sliceContext.fillStyle = "#FFFFFF";
                sliceContext.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                sliceContext.drawImage(
                  canvas,
                  0,
                  sliceTop,
                  canvas.width,
                  sliceHeight,
                  0,
                  0,
                  sliceCanvas.width,
                  sliceCanvas.height
                );

                chunks.push(
                  sliceCanvas
                    .toDataURL("image/png")
                    .replace(/^data:image\\/png;base64,/, "")
                );

                sliceTop += sliceHeight;
              }

              return chunks;
            }

            function renderReceiptToCanvas(payload) {
              var receiptWidth = 380;
              var bottomFeedPadding = 70;
              var measureCanvas = document.createElement("canvas");
              var measureContext = measureCanvas.getContext("2d");
              if (!measureContext) {
                throw new Error("Canvas context is unavailable.");
              }

              var columnItemWidth = Math.floor(receiptWidth * 0.40);
              var columnQtyWidth = Math.floor(receiptWidth * 0.28);
              var columnTotalWidth = receiptWidth - columnItemWidth - columnQtyWidth;
              var totalLabelWidth = Math.floor(receiptWidth * 0.55);
              var totalValueWidth = receiptWidth - totalLabelWidth;
              var xItem = 0;
              var xQty = columnItemWidth;
              var xTotal = columnItemWidth + columnQtyWidth;

              function measureLayout() {
                var y = 0;

                y += drawWrappedText(measureContext, payload.companyName, 0, y, receiptWidth, {
                  size: 24,
                  weight: 800,
                  align: "center",
                  lineHeightRatio: 1.15,
                }).height;
                y += 3;

                y += drawWrappedText(measureContext, payload.shopName, 0, y, receiptWidth, {
                  size: 19,
                  weight: 800,
                  align: "center",
                  lineHeightRatio: 1.15,
                }).height;
                y += 3;

                y += drawWrappedText(measureContext, payload.mobileText, 0, y, receiptWidth, {
                  size: 17,
                  weight: 700,
                  align: "center",
                  lineHeightRatio: 1.15,
                }).height;
                y += 10;
                y += 7; // divider

                y += drawWrappedText(measureContext, payload.toText, 0, y, receiptWidth, {
                  size: 17,
                  weight: 700,
                  align: "left",
                  lineHeightRatio: 1.3,
                }).height;
                
                y += drawWrappedText(measureContext, payload.buyerName, 10, y, receiptWidth - 10, {
                  size: 20,
                  weight: 800,
                  align: "left",
                  lineHeightRatio: 1.3,
                }).height;

                if (payload.buyerShopName) {
                    y += drawWrappedText(measureContext, payload.buyerShopName, 10, y, receiptWidth - 10, {
                        size: 17,
                        weight: 700,
                        align: "left",
                        lineHeightRatio: 1.3,
                    }).height;
                }
                
                y += 10;
                y += 7; // divider

                if (payload.openingBalanceLabel && payload.openingBalanceValue) {
                  y += 7;
                  y += drawWrappedText(
                    measureContext,
                    payload.openingBalanceLabel + ": " + payload.openingBalanceValue,
                    0,
                    y,
                    receiptWidth,
                    {
                      size: 20,
                      weight: 800,
                      align: "center",
                      lineHeightRatio: 1.15,
                    },
                  ).height;
                  y += 8;
                  y += 7; // divider
                }

                y += 7;

                var headerHeight = getLineHeight(16, 1.2);
                y += headerHeight;
                y += 7; // divider

                for (var itemIndex = 0; itemIndex < payload.items.length; itemIndex += 1) {
                  var item = payload.items[itemIndex];
                  var itemNameLines = wrapText(measureContext, item.itemName, columnItemWidth - 6);
                  var itemNameHeight = itemNameLines.length * getLineHeight(18, 1.3);
                  var qtyHeight = getLineHeight(18, 1.15);
                  var totalHeight = measureFittedTextHeight(measureContext, item.lineTotal, columnTotalWidth, {
                    size: 21,
                    weight: 800,
                    lineHeightRatio: 1.15,
                  });
                  var rowHeight = Math.max(itemNameHeight, qtyHeight, totalHeight);

                  y += 8;
                  y += rowHeight;
                  y += 8;
                }

                y += 10;
                y += 7; // divider

                y += measureFittedTextHeight(measureContext, payload.totalValue, totalValueWidth, {
                  size: 20,
                  weight: 800,
                  lineHeightRatio: 1.3,
                });
                y += 8;
                y += measureFittedTextHeight(measureContext, payload.cashValue, totalValueWidth, {
                  size: 18,
                  weight: 700,
                  lineHeightRatio: 1.3,
                });
                y += 8;
                y += measureFittedTextHeight(measureContext, payload.upiValue, totalValueWidth, {
                  size: 18,
                  weight: 700,
                  lineHeightRatio: 1.3,
                });
                y += 8;
                y += measureFittedTextHeight(measureContext, payload.balanceAmountValue, totalValueWidth, {
                  size: 20,
                  weight: 800,
                  lineHeightRatio: 1.2,
                });
                y += 10;
                y += 7; // divider

                if (payload.closingBalanceLabel && payload.closingBalanceValue) {
                  y += 10;
                  y += measureFittedTextHeight(measureContext, payload.closingBalanceValue, receiptWidth, {
                    size: 22,
                    weight: 800,
                    lineHeightRatio: 1.2,
                  });
                  y += 10;
                  y += 7; // divider
                }

                y += 18;

                y += drawWrappedText(measureContext, payload.thankYou, 0, y, receiptWidth, {
                  size: 19,
                  weight: 800,
                  align: "center",
                  lineHeightRatio: 1.3,
                }).height;
                y += 8;

                y += drawWrappedText(measureContext, payload.poweredBy, 0, y, receiptWidth, {
                  size: 13,
                  weight: 700,
                  align: "center",
                  lineHeightRatio: 1.3,
                }).height;
                y += 6;

                drawWrappedText(measureContext, payload.provider, 0, y, receiptWidth, {
                  size: 19,
                  weight: 800,
                  align: "center",
                  lineHeightRatio: 1.3,
                });

                y += getLineHeight(19, 1.3);
                y += bottomFeedPadding;

                return y;
              }

              var receiptHeight = Math.max(1, measureLayout());
              var scale = 2;
              var canvas = document.createElement("canvas");
              canvas.width = receiptWidth * scale;
              canvas.height = receiptHeight * scale;

              var context = canvas.getContext("2d");
              if (!context) {
                throw new Error("Canvas context is unavailable.");
              }

              context.scale(scale, scale);
              context.fillStyle = "#FFFFFF";
              context.fillRect(0, 0, receiptWidth, receiptHeight);
              context.strokeStyle = "#000000";

              var y = 0;

              y += drawWrappedText(context, payload.companyName, 0, y, receiptWidth, {
                size: 24,
                weight: 800,
                align: "center",
                lineHeightRatio: 1.15,
              }).height;
              y += 3;

              y += drawWrappedText(context, payload.shopName, 0, y, receiptWidth, {
                size: 19,
                weight: 800,
                align: "center",
                lineHeightRatio: 1.15,
              }).height;
              y += 3;
              
              y += drawWrappedText(context, payload.mobileText, 0, y, receiptWidth, {
                size: 17,
                weight: 700,
                align: "center",
                lineHeightRatio: 1.15,
              }).height;
              y += 10;

              context.lineWidth = 1.5;
              context.setLineDash([6, 4]);
              context.beginPath();
              context.moveTo(0, y);
              context.lineTo(receiptWidth, y);
              context.stroke();
              context.setLineDash([]);
              y += 7;

              y += drawWrappedText(context, payload.toText, 0, y, receiptWidth, {
                size: 17,
                weight: 700,
                align: "left",
                lineHeightRatio: 1.3,
              }).height;
              
              y += drawWrappedText(context, payload.buyerName, 10, y, receiptWidth - 10, {
                size: 20,
                weight: 800,
                align: "left",
                lineHeightRatio: 1.3,
              }).height;

              if (payload.buyerShopName) {
                  y += drawWrappedText(context, payload.buyerShopName, 10, y, receiptWidth - 10, {
                      size: 17,
                      weight: 700,
                      align: "left",
                      lineHeightRatio: 1.3,
                  }).height;
              }
              
              y += 10;
              
              context.lineWidth = 1.5;
              context.setLineDash([6, 4]);
              context.beginPath();
              context.moveTo(0, y);
              context.lineTo(receiptWidth, y);
              context.stroke();
              context.setLineDash([]);
              y += 7;

              if (payload.openingBalanceLabel && payload.openingBalanceValue) {
                y += 7;

                y += drawWrappedText(
                  context,
                  payload.openingBalanceLabel + ": " + payload.openingBalanceValue,
                  0,
                  y,
                  receiptWidth,
                  {
                    size: 20,
                    weight: 800,
                    align: "center",
                    lineHeightRatio: 1.15,
                  },
                ).height;
                y += 8;

                context.lineWidth = 1.5;
                context.setLineDash([6, 4]);
                context.beginPath();
                context.moveTo(0, y);
                context.lineTo(receiptWidth, y);
                context.stroke();
                context.setLineDash([]);
                y += 7;
              }

              y += 7;

              drawWrappedText(context, payload.itemHeader, xItem, y, columnItemWidth, {
                size: 16,
                weight: 800,
                align: "left",
                lineHeightRatio: 1.2,
              });
              drawWrappedText(context, payload.quantityHeader, xQty, y, columnQtyWidth, {
                size: 16,
                weight: 800,
                align: "left",
                lineHeightRatio: 1.2,
              });
              drawWrappedText(context, payload.totalHeader, xTotal, y, columnTotalWidth, {
                size: 16,
                weight: 800,
                align: "right",
                lineHeightRatio: 1.2,
              });
              y += getLineHeight(16, 1.2);
              y += 7;

              context.lineWidth = 1.5;
              context.setLineDash([6, 4]);
              context.beginPath();
              context.moveTo(0, y);
              context.lineTo(receiptWidth, y);
              context.stroke();
              context.setLineDash([]);

              for (var itemIndex = 0; itemIndex < payload.items.length; itemIndex += 1) {
                var item = payload.items[itemIndex];

                y += 8;
                var itemName = drawWrappedText(context, item.itemName, xItem, y, columnItemWidth - 6, {
                  size: 18,
                  weight: 800,
                  align: "left",
                  lineHeightRatio: 1.3,
                });
                var qtyBlock = drawWrappedText(context, item.quantityText, xQty, y, columnQtyWidth - 4, {
                  size: 18,
                  weight: 700,
                  align: "left",
                  lineHeightRatio: 1.15,
                  noWrap: true,
                });
                var totalBlockHeight = drawFittedText(context, item.lineTotal, xTotal, y, columnTotalWidth, {
                  size: 21,
                  weight: 800,
                  align: "right",
                  lineHeightRatio: 1.15,
                });

                y += Math.max(itemName.height, qtyBlock.height, totalBlockHeight);
                y += 8;
              }

              context.lineWidth = 1.5;
              context.setLineDash([6, 4]);
              context.beginPath();
              context.moveTo(0, y);
              context.lineTo(receiptWidth, y);
              context.stroke();
              context.setLineDash([]);
              y += 10;

              function drawTotalRow(label, value, fontSize, fontWeight) {
                var labelBlock = drawWrappedText(context, label, 0, y, totalLabelWidth, {
                  size: fontSize,
                  weight: fontWeight,
                  align: "left",
                  lineHeightRatio: 1.3,
                });
                var valueHeight = drawFittedText(context, value, totalLabelWidth, y, totalValueWidth, {
                  size: fontSize,
                  weight: fontWeight,
                  align: "right",
                  lineHeightRatio: 1.3,
                });
                return Math.max(labelBlock.height, valueHeight);
              }

              y += drawTotalRow(payload.totalLabel, payload.totalValue, 20, 800);
              y += 8;
              y += drawTotalRow(payload.cashLabel, payload.cashValue, 18, 700);
              y += 8;
              y += drawTotalRow(payload.upiLabel, payload.upiValue, 18, 700);
              y += 8;
              y += drawTotalRow(payload.balanceAmountLabel, payload.balanceAmountValue, 20, 800);
              y += 10;

              context.lineWidth = 1.5;
              context.setLineDash([6, 4]);
              context.beginPath();
              context.moveTo(0, y);
              context.lineTo(receiptWidth, y);
              context.stroke();
              context.setLineDash([]);
              y += 10;
              
              if (payload.closingBalanceLabel && payload.closingBalanceValue) {
                y += drawWrappedText(
                  context,
                  payload.closingBalanceLabel + ": " + payload.closingBalanceValue,
                  0,
                  y,
                  receiptWidth,
                  {
                    size: 22,
                    weight: 800,
                    align: "center",
                    lineHeightRatio: 1.15,
                  },
                ).height;
                y += 10;

                context.lineWidth = 1.5;
                context.setLineDash([6, 4]);
                context.beginPath();
                context.moveTo(0, y);
                context.lineTo(receiptWidth, y);
                context.stroke();
                context.setLineDash([]);
                y += 10;
              }

              y += 18;

              y += drawWrappedText(context, payload.thankYou, 0, y, receiptWidth, {
                size: 19,
                weight: 800,
                align: "center",
                lineHeightRatio: 1.3,
              }).height;
              y += 8;

              y += drawWrappedText(context, payload.poweredBy, 0, y, receiptWidth, {
                size: 13,
                weight: 700,
                align: "center",
                lineHeightRatio: 1.3,
              }).height;
              y += 6;

              drawWrappedText(context, payload.provider, 0, y, receiptWidth, {
                size: 19,
                weight: 800,
                align: "center",
                lineHeightRatio: 1.3,
              });

              y += getLineHeight(19, 1.3);
              context.fillStyle = "#FFFFFF";
              context.fillRect(0, y, receiptWidth, bottomFeedPadding);

              return canvas;
            }

            window.__EXPORT_RECEIPT_IMAGE__ = async function () {
              try {
                await waitForFonts();
                var payload = loadReceiptExportPayload();
                var canvas = renderReceiptToCanvas(payload);
                var base64Chunks = sliceCanvasToBase64Chunks(canvas);
                postMessage({ type: "receipt-export", payload: base64Chunks });
              } catch (error) {
                postMessage({
                  type: "receipt-export-error",
                  payload: error instanceof Error ? error.message : String(error),
                });
              }
            };
          })();
        </script>`;
}

export function buildReceiptHtmlMarkup(exportPayload: ReceiptExportPayload) {
  return `
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <meta charset="utf-8" />
        <style>
          @page { margin: 0; }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            text-shadow: none !important;
            box-shadow: none !important;
          }
          html { background: #fff; }
          body {
            font-family: "Noto Sans Tamil", "Nirmala UI", "Latha", Arial, Helvetica, sans-serif;
            color: #000000;
            margin: 0;
            padding: 12px;
            font-size: 14px;
            line-height: 1.3;
            background: #fff;
            font-weight: 600;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -webkit-text-size-adjust: 100%;
            text-size-adjust: 100%;
            font-kerning: none;
            letter-spacing: 0;
          }
        </style>
      </head>
      <body>
        <div class="receipt-stack">
        </div>
        <script id="receipt-export-data" type="application/json">${serializeReceiptExportPayload(exportPayload)}</script>
        ${buildReceiptImageExportScript()}
      </body>
    </html>`;
}
