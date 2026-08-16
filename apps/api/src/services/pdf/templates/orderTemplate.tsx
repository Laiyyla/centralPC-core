import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Estilos del documento usando Flexbox nativo
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#334155",
    backgroundColor: "#f1f5f9",
    padding: 4,
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
  },
  bold: {
    fontWeight: "bold",
  },
  // Estilos de Tabla
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: 5,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    padding: 5,
  },
  colDesc: { width: "60%" },
  colQty: { width: "15%", textAlign: "center" },
  colPrice: { width: "25%", textAlign: "right" },
  totalSection: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalBox: {
    width: "40%",
    borderTopWidth: 1,
    borderTopColor: "#0f172a",
    paddingTop: 5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 12,
    fontWeight: "bold",
  },
});

interface OrderPdfProps {
  order: any; // Mantiene compatibilidad con la estructura devuelta por Drizzle
}

export const OrderPdfTemplate: React.FC<OrderPdfProps> = ({ order }) => {
  const sucursal = order.branch;
  const cliente = order.client;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabecera */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>
              {sucursal?.nombre || "CENTRAL PC"}
            </Text>
            <Text style={styles.textRow}>
              RUC: {sucursal?.ruc_empresa || "N/A"}
            </Text>
            <Text style={styles.textRow}>
              Serie: {sucursal?.serie || "B001"}
            </Text>
          </View>
          <View>
            <Text style={styles.orderTitle}>ÓRDEN DE SERVICIO</Text>
            <Text style={{ ...styles.textRow, textAlign: "right" }}>
              N° {order.correlativo}
            </Text>
            <Text style={{ ...styles.textRow, textAlign: "right" }}>
              Fecha: {new Date(order.fecha_emision).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Información del Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
          <View style={styles.grid}>
            <View style={styles.col}>
              <Text style={styles.textRow}>
                <Text style={styles.bold}>Nombre: </Text>
                {cliente?.nombre || "Cliente Varios"}
              </Text>
              <Text style={styles.textRow}>
                <Text style={styles.bold}>DNI/RUC: </Text>
                {cliente?.dni || cliente?.ruc || "N/A"}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.textRow}>
                <Text style={styles.bold}>Teléfono: </Text>
                {cliente?.telefono || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Equipos Registrados (si aplica) */}
        {order.devices && order.devices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EQUIPOS INGRESADOS</Text>
            {order.devices.map((device: any, index: number) => (
              <View key={device.id || index} style={{ marginBottom: 4 }}>
                <Text style={styles.textRow}>
                  • <Text style={styles.bold}>{device.tipo_equipo}:</Text>{" "}
                  {device.descripcion}{" "}
                  {device.observaciones ? `(${device.observaciones})` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Tabla de Detalle / Ítems */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Descripción</Text>
            <Text style={styles.colQty}>Cant.</Text>
            <Text style={styles.colPrice}>Subtotal</Text>
          </View>

          {order.details?.map((item: any, index: number) => (
            <View key={item.id || index} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.nombre_snap}</Text>
              <Text style={styles.colQty}>{item.cantidad}</Text>
              <Text style={styles.colPrice}>
                S/ {Number(item.subtotal).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text>TOTAL:</Text>
              <Text>S/ {Number(order.total).toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
