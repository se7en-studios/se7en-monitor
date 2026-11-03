# SE7EN MONITOR
### Sistema Inteligente de Monitoreo de Cámaras para Establecimientos Educativos
**Desarrollado por Se7en Studio**

---

## 1. Visión del Producto

**SE7EN MONITOR** es una plataforma SaaS de videovigilancia institucional diseñada para municipios, ministerios de educación y organismos de seguridad pública.

Inspirado en la ordenanza municipal de **Catriel (Río Negro)** sobre el **«Corredor Escolar Cuidado Monitoreado»**, el sistema centraliza la supervisión preventiva en un **radio de 200 metros** alrededor de las instituciones educativas públicas y privadas, garantizando la seguridad en los horarios de ingreso, egreso y tránsito de los estudiantes.

### Principios Fundamentales de Privacidad Escolar
- **Cero Reconocimiento Facial:** Prohibición estricta de identificación biométrica o perfilado de menores.
- **Transmisión Efímera Punto a Punto (WebRTC):** Sin retención ni almacenamiento indiscriminado de video de estudiantes en la nube.
- **Audio Silenciado por Defecto:** Cumplimiento de normativas de privacidad institucional.
- **Trazabilidad y Auditoría:** Registro de todas las acciones administrativas con fines de transparencia pública.

---

## 2. Stack Tecnológico

- **Frontend & Framework:** Next.js (App Router) + TypeScript + React 19
- **Estilos & Diseño:** Tailwind CSS + Tokens Dark SaaS inspirados en Se7en Studio CRM
- **Iconografía:** Lucide React
- **Backend & Base de Datos:** Firebase (Cloud Firestore + Authentication, tiempo real con `onSnapshot`)
- **Streaming de Video:** WebRTC (`RTCPeerConnection` P2P + Señalización por Firestore)
- **Código QR:** Generador dinámico para vinculación de teléfonos celulares
- **Despliegue:** Preparado para Vercel y GitHub

---

## 3. Arquitectura del Proyecto

```
MONITOREO ESCUELAS/
├── app/
│   ├── layout.tsx                # Shell general con metadata e inyección de tema
│   ├── globals.css               # Tokens de diseño, gradientes y animaciones
│   ├── page.tsx                  # Dashboard principal (KPIs, gráficos, actividad en tiempo real)
│   ├── monitor/
│   │   ├── live/page.tsx         # Centro de monitoreo con grilla multivista (1x1, 2x2, 3x3)
│   │   └── cameras/page.tsx      # Catálogo y administrador de dispositivos
│   ├── schools/page.tsx          # CRM de Establecimientos Educativos con radio 200m
│   ├── map/page.tsx              # GIS / Mapa táctico de corredores escolares y cámaras
│   ├── incidents/page.tsx        # CRM de Incidentes y novedades operativas
│   ├── alerts/page.tsx           # Panel de alertas de conectividad y sensores
│   ├── maintenance/page.tsx      # Órdenes de trabajo para cuadrillas técnicas
│   ├── reports/page.tsx          # Informes de disponibilidad y SLA
│   ├── users/page.tsx            # Roles y permisos (Super Admin, Municipal, Operador)
│   ├── settings/page.tsx         # Parámetros de seguridad y políticas de privacidad
│   └── camera/
│       ├── connect/page.tsx      # Pasarela de conexión de dispositivos móviles
│       └── publish/[token]/      # Consola móvil P2P para transmitir desde celular
├── components/
│   ├── sidebar.tsx               # Navegación fija con 11 módulos
│   ├── topbar.tsx                # Cabecera con reloj en vivo, buscador y avatar
│   ├── stat-card.tsx             # Tarjetas de indicadores con tendencias
│   ├── dashboard-charts.tsx      # Gráficos de barras y distribución de disponibilidad
│   ├── activity-feed.tsx         # Feed en tiempo real de eventos auditados
│   ├── status-badge.tsx          # Insignias de estado (Online, Alerta, Offline)
│   └── connect-mobile-modal.tsx  # Modal con código QR para vincular celular
├── data/
│   └── demo-data.ts              # Datos demo de Catriel (solo para `npm run seed:firebase`)
├── lib/
│   ├── utils.ts                  # Helpers de clases y formateo de fechas
│   ├── roles.ts                  # Roles y permisos (espejo de firestore.rules)
│   └── firebase/                 # config, auth-context, data (onSnapshot/CRUD), webrtc
├── firestore.rules               # Reglas por rol (desplegar con `firebase deploy --only firestore:rules`)
├── types/
│   └── monitor.ts                # Modelos de datos en TypeScript
├── .env.example                  # Plantilla de variables de entorno
└── package.json                  # Dependencias y scripts de compilación
```

---

## 4. Instalación y Ejecución Local

### Prerrequisitos
- Node.js 18 o superior instalado
- Git

### Pasos

1. Clonar el repositorio o ingresar a la carpeta:
```bash
cd "MONITOREO ESCUELAS"
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env.local
```

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

5. Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

## 5. Prueba de la Funcionalidad Celular a Computadora

1. En la computadora, hacer clic en el botón superior **"Conectar Celular"** o ir a la sección **Cámaras**.
2. Se desplegará un **Código QR** y un enlace temporal con token seguro.
3. Abrir el enlace o escanear el QR desde el teléfono móvil conectado a la misma red WiFi o con datos móviles.
4. En el celular se abrirá la consola móvil:
   - Aceptar permisos de cámara.
   - Seleccionar cámara trasera o frontal.
   - Pulsar **INICIAR TRANSMISIÓN AL DASHBOARD**.
5. En la computadora, ingresar a **Monitoreo en vivo** (`/monitor/live`) para visualizar el dispositivo móvil en la grilla.

---

## 6. Próximas Etapas

- ~~Etapa 2/3~~ Hecho: Firestore en tiempo real, login y roles; el Super Admin crea operadores en `/users`.
- **Etapa 4 (Streaming Avanzado):** Pipeline WebRTC automatizado con servidor TURN/STUN para NAT traversal estricto.
- **Etapa 5 (Expansión):** Georreferenciación dinámica con capas satelitales y reportería exportable a PDF/Excel.


## 7. Puesta en marcha de Auth + Firestore

1. Firebase Console → Authentication → habilitar **Correo electrónico/contraseña**.
2. Desplegar reglas: `firebase deploy --only firestore:rules` (o pegar `firestore.rules` en la consola).
3. Cuenta de servicio (Configuración del proyecto → Cuentas de servicio → Generar clave), guardada **fuera del repo**.
4. Crear el primer Super Admin y cargar datos demo:
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\clave.json"
   $env:SUPERADMIN_EMAIL="tu@mail"; $env:SUPERADMIN_PASSWORD="..."; $env:SUPERADMIN_NAME="Tu Nombre"
   npm run seed:firebase
   ```
5. Ingresar a la app y crear al resto de operadores desde **Usuarios y permisos**.
