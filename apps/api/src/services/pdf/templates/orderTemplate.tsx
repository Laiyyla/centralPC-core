import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, "..", "assets");
const fontsDir = path.join(assetsDir, "fonts");
const logoPath = path.join(assetsDir, "Logo_cptic_corrected.png");

Font.register({
  family: "Montserrat",
  fonts: [
    { src: path.join(fontsDir, "Montserrat-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(fontsDir, "Montserrat-SemiBold.ttf"), fontWeight: "semibold" },
    { src: path.join(fontsDir, "Montserrat-Bold.ttf"), fontWeight: "bold" },
  ],
});

const BLUE = "#277DF5";
const DARK = "#1e293b";
const GRAY_100 = "#f3f4f6";
const GRAY_300 = "#d1d5db";
const WHITE = "#ffffff";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: "Montserrat",
    color: DARK,
  },
  // --- Header ---
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  logo: {
    width: 150,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: BLUE,
  },
  headerText: {
    fontSize: 9,
    marginTop: 2,
    color: DARK,
  },
  headerDivider: {
    height: 2,
    backgroundColor: BLUE,
    marginBottom: 16,
  },
  // --- Sections ---
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: BLUE,
    marginBottom: 6,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  col: {
    width: "48%",
  },
  textRow: {
    marginBottom: 3,
    fontSize: 9,
  },
  label: {
    fontWeight: "semibold",
    color: "#475569",
  },
  // --- Table ---
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BLUE,
    padding: 6,
    borderRadius: 2,
  },
  tableHeaderText: {
    color: WHITE,
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY_300,
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: 6,
    backgroundColor: GRAY_100,
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY_300,
  },
  colDesc: { width: "55%" },
  colQty: { width: "15%", textAlign: "center" },
  colUnit: { width: "15%", textAlign: "right" },
  colPrice: { width: "15%", textAlign: "right" },
  // --- Total ---
  totalSection: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalBox: {
    width: "35%",
    backgroundColor: BLUE,
    borderRadius: 2,
    padding: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: WHITE,
    fontSize: 11,
    fontWeight: "bold",
  },
  totalValue: {
    color: WHITE,
    fontSize: 11,
    fontWeight: "bold",
  },
  // --- Footer ---
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
  },
  disclaimer: {
    fontSize: 7.5,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 8,
  },
  footerBar: {
    height: 3,
    backgroundColor: BLUE,
    borderRadius: 1,
  },
});

interface OrderPdfProps {
  order: any;
}

export const OrderPdfTemplate: React.FC<OrderPdfProps> = ({ order }) => {
  const sucursal = order.branch;
  const cliente = order.client;

  const formatCorrelativo = (serie?: string, correlativo?: number) => {
    const prefijo = serie || "B001";
    const numero = String(correlativo || 0).padStart(6, "0");
    return `${prefijo}-${numero}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={logoPath} style={styles.logo} />
          <View style={styles.headerRight}>
            <Text style={styles.orderTitle}>ORDEN DE SERVICIO</Text>
            <Text style={styles.headerText}>
              N° {formatCorrelativo(sucursal?.serie, order.correlativo)}
            </Text>
            <Text style={styles.headerText}>
              RUC: {sucursal?.RUC || "N/A"}
            </Text>
            <Text style={styles.headerText}>
              Fecha: {new Date(order.fecha_emision).toLocaleDateString("es-PE")}
            </Text>
          </View>
        </View>
        <View style={styles.headerDivider} />

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
          <View style={styles.grid}>
            <View style={styles.col}>
              <Text style={styles.textRow}>
                <Text style={styles.label}>Nombre: </Text>
                {cliente?.nombre || "Cliente Varios"}
              </Text>
              <Text style={styles.textRow}>
                <Text style={styles.label}>DNI/RUC: </Text>
                {cliente?.dni || cliente?.ruc || "N/A"}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.textRow}>
                <Text style={styles.label}>Teléfono: </Text>
                {cliente?.telefono || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Devices */}
        {order.devices && order.devices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EQUIPOS INGRESADOS</Text>
            {order.devices.map((device: any, index: number) => (
              <View key={device.id || index} style={{ marginBottom: 3 }}>
                <Text style={styles.textRow}>
                  •{" "}
                  <Text style={styles.label}>{device.tipo_equipo}: </Text>
                  {device.descripcion}
                  {device.observaciones ? ` (${device.observaciones})` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Detail table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALLE</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ ...styles.tableHeaderText, ...styles.colDesc }}>
                Descripción
              </Text>
              <Text style={{ ...styles.tableHeaderText, ...styles.colQty }}>
                Cant.
              </Text>
              <Text style={{ ...styles.tableHeaderText, ...styles.colUnit }}>
                P. Unit.
              </Text>
              <Text style={{ ...styles.tableHeaderText, ...styles.colPrice }}>
                Subtotal
              </Text>
            </View>

            {order.details?.map((item: any, index: number) => (
              <View
                key={item.id || index}
                style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={styles.colDesc}>{item.nombre_snap}</Text>
                <Text style={styles.colQty}>{item.cantidad}</Text>
                <Text style={styles.colUnit}>
                  S/ {Number(item.precio_unit_snap).toFixed(2)}
                </Text>
                <Text style={styles.colPrice}>
                  S/ {Number(item.subtotal).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalValue}>
              S/ {Number(order.total).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            Todo recojo y/o reclamo debe realizarse presentando este documento.
          </Text>
          <View style={styles.footerBar} />
        </View>
      </Page>
    </Document>
  );
};
