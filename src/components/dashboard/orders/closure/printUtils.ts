
import { ClosureData } from "./types";

export const printClosureReport = (data: ClosureData, hotelName: string) => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    const currentTime = new Date().toLocaleString('es-ES');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Cierre Z - ${data.fecha}</title>
          <style>
            @media print {
              @page { 
                size: 80mm auto; 
                margin: 0; 
              }
            }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px;
              margin: 0;
              padding: 10px;
              width: 80mm;
              line-height: 1.2;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .separator { 
              border-top: 1px dashed #000; 
              margin: 10px 0; 
            }
            .double-separator { 
              border-top: 2px solid #000; 
              margin: 10px 0; 
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            .total-section {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 2px solid #000;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <div class="center bold">
            ${hotelName.toUpperCase()}
          </div>
          <div class="center bold">
            === CIERRE Z ===
          </div>
          <div class="center">
            ${data.fecha} - ${currentTime}
          </div>
          <div class="center">
            CIERRE FINAL DEL DIA
          </div>
          
          <div class="double-separator"></div>
          
          <div class="bold">RESUMEN FINAL:</div>
          <div class="row">
            <span>Total pedidos:</span>
            <span class="bold">${data.totalPedidos}</span>
          </div>
          <div class="row">
            <span>Completados:</span>
            <span class="bold">${data.pedidosCompletados}</span>
          </div>
          <div class="row">
            <span>Cancelados:</span>
            <span>${data.pedidosCancelados}</span>
          </div>
          
          <div class="separator"></div>
          
          <div class="bold">DESGLOSE POR PAGO:</div>
          ${Object.entries(data.metodosDetalle).map(([metodo, info]: [string, any]) => `
          <div class="row">
            <span>${metodo.charAt(0).toUpperCase() + metodo.slice(1)}:</span>
            <span>${info.cantidad} (€${info.total.toFixed(2)})</span>
          </div>
          `).join('')}
          
          <div class="total-section">
            <div class="row bold">
              <span>TOTAL FINAL DEL DIA:</span>
              <span>€${data.totalDinero.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="double-separator"></div>
          
          <div class="center bold">
            CIERRE REALIZADO
          </div>
          <div class="center">
            Pedidos archivados: ${data.totalPedidos}
          </div>
          <div class="center">
            Estado: CERRADO
          </div>
          
          <div class="footer">
            Fin del servicio del dia
            <br>
            Cierre: ${currentTime}
            <br><br>
            <strong>MarjorAI</strong>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
};

export const downloadExtract = (closureData: ClosureData, hotelName: string) => {
  const metodosTexto = Object.entries(closureData.metodosDetalle).map(([metodo, info]: [string, any]) => 
    `• ${metodo.charAt(0).toUpperCase() + metodo.slice(1)}: ${info.cantidad} pedidos (€${info.total.toFixed(2)})`
  ).join('\n');

  const extractContent = `
CIERRE Z - EXTRACTO FINAL DEL DÍA
${hotelName.toUpperCase()}
Fecha: ${closureData.fecha}
Generado: ${closureData.timestamp}

═══════════════════════════════════

RESUMEN FINAL DEL DÍA:
• Total de pedidos procesados: ${closureData.totalPedidos}
• Pedidos completados: ${closureData.pedidosCompletados}
• Pedidos cancelados: ${closureData.pedidosCancelados}
• Total recaudado: €${closureData.totalDinero.toFixed(2)}

DESGLOSE POR MÉTODOS DE PAGO:
${metodosTexto}

═══════════════════════════════════

ESTADO: CERRADO
Los pedidos han sido archivados correctamente.
Fin del servicio del día.

Cierre realizado: ${closureData.timestamp}

MarjorAI
  `;

  const blob = new Blob([extractContent], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cierre-z-${closureData.fecha.replace(/\//g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
