import { NativeModules, PermissionsAndroid, Platform } from "react-native";
import {
  type IBLEPrinter,
  type PrinterImageOptions as NativePrinterImageOptions,
  type PrinterOptions as NativePrinterOptions,
} from "@haroldtran/react-native-thermal-printer";

import {
  PrinterDevice,
  PrinterSupportState,
  PrinterTransport,
} from "../types/printer";

const PAPER_WIDTH_58 = 32;

type ReceiptLineAlignment = "left" | "center";

type PrintableReceiptLine = {
  text: string;
  align?: ReceiptLineAlignment;
  bold?: boolean;
  doubleSize?: boolean;
};

type PrinterOptions = {
  beep?: boolean;
  cut?: boolean;
  tailingLine?: boolean;
  encoding?: string;
  onError?: (error: Error) => void;
};

type PrinterRuntime = {
  init: () => Promise<void>;
  getDeviceList: () => Promise<PrinterDevice[]>;
  connect: (device: PrinterDevice) => Promise<void>;
  closeConn: () => Promise<void>;
  printBill: (text: string, options?: PrinterOptions) => Promise<void>;
  printImageBase64: (base64: string, options?: NativePrinterImageOptions) => Promise<void>;
};

export type DeliveryReceiptData = {
  receipt_number: string;
  date: string;
  buyer_name: string;
  item_name: string;
  full_delivered: number;
  empty_received: number;
  total_bill: number;
  cash_collected: number;
  upi_collected: number;
};

const RECEIPT_COPY = {
  receipt: "Receipt",
  date: "Date",
  buyer: "Buyer",
  cash: "Cash",
  upi: "UPI",
  total: "Total",
  thankYou: "THANK YOU",
  poweredBy: "Powered by Duro Tracker",
};

function formatCurrency(amount: number) {
  return `Rs. ${amount.toFixed(2)}`;
}

function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString();
}

function getThermalPrinterModule() {
  return require("@haroldtran/react-native-thermal-printer") as {
    BLEPrinter: typeof import("@haroldtran/react-native-thermal-printer").BLEPrinter;
    USBPrinter: typeof import("@haroldtran/react-native-thermal-printer").USBPrinter;
    COMMANDS: typeof import("@haroldtran/react-native-thermal-printer").COMMANDS;
  };
}

function getCommandText() {
  const { COMMANDS } = getThermalPrinterModule();

  return {
    CENTER: COMMANDS.TEXT_FORMAT.TXT_ALIGN_CT,
    LEFT: COMMANDS.TEXT_FORMAT.TXT_ALIGN_LT,
    BOLD_ON: COMMANDS.TEXT_FORMAT.TXT_BOLD_ON,
    BOLD_OFF: COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF,
    DOUBLE_SIZE:
      COMMANDS.TEXT_FORMAT.TXT_2HEIGHT +
      COMMANDS.TEXT_FORMAT.TXT_2WIDTH,
    NORMAL: COMMANDS.TEXT_FORMAT.TXT_NORMAL,
    DIVIDER: COMMANDS.HORIZONTAL_LINE.HR3_58MM,
  } as const;
}

function getAndroidApiLevel() {
  return typeof Platform.Version === "number"
    ? Platform.Version
    : Number(Platform.Version ?? 0);
}

function hasBluetoothModule() {
  return Boolean(NativeModules.RNBLEPrinter);
}

function hasUsbModule() {
  return Boolean(NativeModules.RNUSBPrinter);
}

async function requestBluetoothPermissions() {
  if (Platform.OS !== "android") {
    return true;
  }

  const apiLevel = getAndroidApiLevel();
  const permissions =
    apiLevel >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

  const statuses = await PermissionsAndroid.requestMultiple(permissions);
  return permissions.every(
    (permission) =>
      statuses[permission] === PermissionsAndroid.RESULTS.GRANTED,
  );
}

function getTransportLabel(transport: PrinterTransport) {
  return transport === "bluetooth" ? "Bluetooth" : "USB";
}

export function getSavedPrinterLabel(device: PrinterDevice) {
  return `${getTransportLabel(device.transport)} - ${device.name}`;
}

export function getPrinterDeviceDetail(device: PrinterDevice) {
  return device.transport === "bluetooth"
    ? device.address ?? device.deviceName ?? device.name
    : `${device.vendorId ?? "?"}/${device.productId ?? "?"}`;
}

function padColumns(left: string, right: string, width = PAPER_WIDTH_58) {
  const safeLeft = left.trim();
  const safeRight = right.trim();
  const spacing = Math.max(
    1,
    width - safeLeft.length - safeRight.length,
  );

  if (safeLeft.length + safeRight.length + 1 <= width) {
    return `${safeLeft}${" ".repeat(spacing)}${safeRight}`;
  }

  return `${safeLeft}\n${" ".repeat(
    Math.max(0, width - safeRight.length),
  )}${safeRight}`;
}

function buildPrintableReceiptLines(data: DeliveryReceiptData): PrintableReceiptLine[] {
  const copy = RECEIPT_COPY;
  const divider = "-".repeat(PAPER_WIDTH_58);

  const lines: PrintableReceiptLine[] = [
    { text: "DURO TRACKER", align: "center", bold: true, doubleSize: true },
    { text: "DELIVERY CHALLAN", align: "center", bold: true },
    { text: "" },
    { text: `${copy.receipt}: ${data.receipt_number}` },
    { text: `${copy.date}: ${formatDateTime(data.date)}` },
    { text: `${copy.buyer}: ${data.buyer_name}`, bold: true },
    { text: divider },
    { text: `Item: ${data.item_name}` },
    { text: `Full Delivered: ${data.full_delivered}` },
    { text: `Empty Received: ${data.empty_received}` },
    { text: divider },
    { text: padColumns(copy.total, formatCurrency(data.total_bill)), bold: true },
    { text: padColumns(copy.cash, formatCurrency(data.cash_collected)) },
    { text: padColumns(copy.upi, formatCurrency(data.upi_collected)) },
  ];
  
  const balance = data.total_bill - (data.cash_collected + data.upi_collected);
  lines.push({ text: padColumns("Balance Due", formatCurrency(balance)) });
  
  lines.push({ text: divider });
  lines.push({ text: copy.thankYou, align: "center", bold: true });
  lines.push({ text: copy.poweredBy, align: "center" });
  lines.push({ text: "" });
  lines.push({ text: "" });

  return lines;
}

function buildPrintableReceipt(data: DeliveryReceiptData) {
  const COMMAND_TEXT = getCommandText();

  return buildPrintableReceiptLines(data)
    .map((line) => {
      const alignCommand =
        line.align === "center" ? COMMAND_TEXT.CENTER : COMMAND_TEXT.LEFT;
      const sizeCommand = line.doubleSize
        ? COMMAND_TEXT.DOUBLE_SIZE
        : COMMAND_TEXT.NORMAL;
      const weightCommand = line.bold
        ? COMMAND_TEXT.BOLD_ON
        : COMMAND_TEXT.BOLD_OFF;

      return `${alignCommand}${sizeCommand}${weightCommand}${line.text}${COMMAND_TEXT.BOLD_OFF}${COMMAND_TEXT.NORMAL}`;
    })
    .join("\n");
}

function buildTestReceipt(device: PrinterDevice) {
  const COMMAND_TEXT = getCommandText();

  return [
    `${COMMAND_TEXT.CENTER}${COMMAND_TEXT.BOLD_ON}PRINTER LINKED${COMMAND_TEXT.BOLD_OFF}`,
    `${COMMAND_TEXT.LEFT}${getSavedPrinterLabel(device)}`,
    device.address ? `Address: ${device.address}` : "",
    `Checked: ${formatDateTime(new Date().toISOString())}`,
    COMMAND_TEXT.DIVIDER,
    "Ready for live receipts.",
    "",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

function getPrintOptions(onError?: (error: Error) => void): NativePrinterOptions {
  return {
    beep: true,
    cut: true,
    tailingLine: true,
    encoding: "UTF8",
    onError,
  };
}

function toError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

function isNoDeviceFound(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes("no device found");
}

function waitForPrintDispatch(
  dispatch: (options: NativePrinterOptions) => void,
  options: PrinterOptions = {},
  settleDelayMs = 400,
) {
  return new Promise<void>((resolve, reject) => {
    let settled = false;

    dispatch(
      getPrintOptions((error) => {
        if (settled) {
          return;
        }

        settled = true;
        options.onError?.(error);
        reject(toError(error));
      }),
    );

    setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      resolve();
    }, settleDelayMs);
  });
}

function normalizeBluetoothPrinter(printer: IBLEPrinter): PrinterDevice {
  return {
    id: `bluetooth:${printer.inner_mac_address}`,
    transport: "bluetooth",
    name: printer.device_name?.trim() || "Bluetooth Printer",
    address: printer.inner_mac_address,
    deviceName: printer.device_name,
  };
}

function dedupePrinters(devices: PrinterDevice[]) {
  const registry = new Map<string, PrinterDevice>();

  devices.forEach((device) => {
    registry.set(device.id, device);
  });

  return [...registry.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function createBluetoothRuntime(): PrinterRuntime {
  if (!hasBluetoothModule()) {
    throw new Error(
      "Bluetooth printer support needs an Android development build or release build.",
    );
  }

  const { BLEPrinter } = getThermalPrinterModule();

  return {
    init: () => BLEPrinter.init(),
    getDeviceList: async () => {
      try {
        const printers = await BLEPrinter.getDeviceList();
        return dedupePrinters(printers.map(normalizeBluetoothPrinter));
      } catch (error) {
        if (isNoDeviceFound(error)) {
          return [];
        }

        throw toError(error);
      }
    },
    connect: async (device) => {
      if (!device.address) {
        throw new Error(
          "This Bluetooth printer is missing its device address.",
        );
      }

      await BLEPrinter.connectPrinter(device.address);
    },
    closeConn: () => BLEPrinter.closeConn(),
    printBill: (text, options = {}) =>
      waitForPrintDispatch(
        (nativeOptions) => BLEPrinter.printBill(text, nativeOptions),
        options,
      ),
    printImageBase64: async () => {}, // Unimplemented
  };
}

async function ensureBluetoothPrinterReady() {
  if (Platform.OS !== "android") {
    throw new Error(
      "Bluetooth receipt printing is currently available only on Android.",
    );
  }

  if (!hasBluetoothModule()) {
    throw new Error(
      "Bluetooth printer support needs an Android development build or release build.",
    );
  }

  const permissionGranted = await requestBluetoothPermissions();
  if (!permissionGranted) {
    throw new Error(
      "Bluetooth permissions were denied. Allow printer permissions and try again.",
    );
  }

  const runtime = createBluetoothRuntime();
  await runtime.init();
  return runtime;
}

async function getPrinterRuntime(device: PrinterDevice) {
  return ensureBluetoothPrinterReady();
}

async function closePrinterConnection(printer: PrinterRuntime) {
  try {
    await printer.closeConn();
  } catch {
    // Some devices throw here when no session is open, which is safe to ignore.
  }
}

async function connectWithRetry(
  printer: PrinterRuntime,
  device: PrinterDevice,
) {
  try {
    await printer.connect(device);
  } catch (error) {
    await closePrinterConnection(printer);

    try {
      await printer.connect(device);
    } catch {
      throw toError(error);
    }
  }
}

async function withPrinterConnection<T>(
  device: PrinterDevice,
  run: (printer: PrinterRuntime) => Promise<T>,
) {
  const printer = await getPrinterRuntime(device);

  await closePrinterConnection(printer);
  await connectWithRetry(printer, device);

  try {
    return await run(printer);
  } finally {
    await closePrinterConnection(printer);
  }
}

export function getPrinterSupportState(): PrinterSupportState {
  if (Platform.OS !== "android") {
    return {
      supported: false,
      bluetooth: false,
      usb: false,
      reason:
        "Direct Bluetooth and USB thermal printing are currently available only on Android.",
    };
  }

  const bluetooth = hasBluetoothModule();
  const usb = hasUsbModule();

  if (!bluetooth && !usb) {
    return {
      supported: false,
      bluetooth: false,
      usb: false,
      reason:
        "Printer support needs an Android development build or release build. Expo Go cannot load these native printer modules.",
    };
  }

  return {
    supported: true,
    bluetooth,
    usb,
  };
}

export async function loadBluetoothPrinters() {
  const printer = await ensureBluetoothPrinterReady();
  return printer.getDeviceList();
}

export async function loadUsbPrinters() {
  return []; // Mocked out for Tracker
}

export async function connectPrinterDevice(device: PrinterDevice) {
  await withPrinterConnection(device, async () => undefined);
  return device;
}

export async function printTestReceipt(device: PrinterDevice) {
  await withPrinterConnection(device, async (printer) => {
    await printer.printBill(buildTestReceipt(device));
  });
}

export async function printDeliveryReceipt(
  data: DeliveryReceiptData,
  device: PrinterDevice,
) {
  await withPrinterConnection(device, async (printer) => {
    await printer.printBill(buildPrintableReceipt(data));
  });
}
