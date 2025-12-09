[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/IsmaNov12/libreblog-nextjs)

# LibreBlog

LibreBlog es una plataforma moderna de blogging desarrollada con Next.js 16.0.8, donde los usuarios pueden crear, compartir y descubrir contenido de manera libre y segura. Incluye un editor Markdown avanzado, sistema de comentarios anidados, notificaciones en tiempo real, moderación NSFW manual, perfiles personalizables con temas y decoraciones, y un sistema de seguridad completo con autenticación via Supabase, verificación de contraseñas comprometidas y Row Level Security. Diseñada para ser responsive, accesible y escalable, con deployment optimizado en Vercel (v2.1.0).

## Características

### Creación y Gestión de Contenido
- **Editor Markdown avanzado**: Soporte completo para sintaxis Markdown (negritas, listas, enlaces, etc.), separación en páginas con `---PAGE---` para navegación, tabla de contenidos generada automáticamente, y edición responsiva con vista previa en tiempo real.
- **Categorización**: Los posts se clasifican en categorías personalizadas para facilitar la exploración y filtrado.
- **Soporte multimedia**: Inserción de imágenes y videos embebidos por URL directa (soporta YouTube, TikTok, Facebook); no se suben archivos locales para mantener ligereza.
- **Vista previa y paginación**: Vista previa interactiva durante la edición, con paginación automática para posts largos.
- **Público y privados**: Los posts pueden publicarse inmediatamente o guardarse como borradores privados.
- **Comentarios y PDF**: Opción para habilitar/deshabilitar comentarios por post, y descarga del contenido en formato PDF usando html2pdf.js.

### Interacción Social
- **Sistema de comentarios**: Comentarios anidados (hasta 3 niveles de profundidad), edición/eliminación por autor, límites personalizables por post (ej. máximo 100 comentarios), con paginación.
- **Sistema de notificaciones**: Notificaciones en tiempo real via WebSockets para eventos sociales (follows, comentarios, likes, respuestas). Panel responsive con historial completo, marcas de leído y filtros por tipo.
- **Seguimiento de usuarios**: Sistema de follows bidireccional para obtener un feed personalizado de posts de usuarios seguidos, con paginación infinita en `/following`.
- **Likes y favoritos**: Interacción rápida con likes en posts, almacenados en tabla `Like` de Prisma, con conteo en tiempo real actualizado via API.
- **Blocklist y censura personalizada**: Bloqueo de usuarios (oculta todo su contenido via `blockedUsers` state), o censura selectiva de posts específicos, configurable desde perfiles o settings.

### Moderación y Protección NSFW
- **Moderación NSFW manual**: Checkbox en el formulario de creación/edición de posts para marcar contenido NSFW; se guarda en campo `isNSFW` de la tabla `Post` (no hay detección automática ni reportes de usuarios para contenido NSFW).
- **Protección personal NSFW**: Toggle en settings para activar filtro borroso; persistente en campo `nsfwProtection` de la tabla `User`, con valor por defecto `true`.
- **Blur y advertencias**: Componente `NSFWFilter` aplica blur a imágenes y texto de posts NSFW; muestra advertencia con botón de confirmación para revelar contenido.

### Perfiles y Temas Personalizados
- **Perfiles públicos**: Páginas de perfil editables con bio (texto plano), avatar (Gravatar o URL custom), enlaces sociales (GitHub, LinkedIn, etc.), estadísticas de seguidores/seguidos calculadas dinámicamente.
- **Decoraciones de avatar**: 16 opciones de decoraciones GIF (ej. Halloween, cyberpunk) superpuestas al avatar via CSS absolute positioning, almacenadas en `allDecorations` array.
- **Temas de perfil**: Selector de 6 temas (ej. Aurora, Minimal) que aplican clases Tailwind dinámicas a fondos, tarjetas y textos, guardados en campo `profileTheme` de `User`.

### Seguridad y Privacidad
- **Registro/login con Supabase Auth**: Flujo seguro con confirmación de email obligatoria via SMTP; middleware restringe rutas a usuarios autenticados.
- **Verificación de contraseñas comprometidas**: API `check-password` consulta HaveIBeenPwned (solo hash SHA-1 de primeros 5 caracteres) durante registro/reset para bloquear passwords filtradas.
- **2FA y gestión**: Autenticación de dos factores via TOTP/email, panel en `/settings` para revocar sesiones, cambiar password y gestionar dispositivos.
- **Anti-spam y validación**: Rate limiting por IP, honeypots invisibles en formularios, validación de emails (formato y bloqueo de desechables via lista interna).
- **Row Level Security (RLS)**: Políticas en PostgreSQL (ej. `auth.uid() = userId`) que restringen queries a datos propios, ejecutadas via Prisma.

## Tecnologías Principales

- **Next.js 16.0.8**: Framework React para SSR/SSG, con App Router para rutas anidadas, Server Components para data fetching eficiente, y API Routes para backend.
- **React 19.1.2**: Librería para UI con hooks y concurrent features; TypeScript agrega type safety a componentes y props.
- **Tailwind CSS 4.1.14**: Framework utility-first para estilos rápidos y consistentes; usado con @tailwindcss/typography para Markdown.
- **Prisma ORM 6.17.1**: Mapeo objeto-relacional para PostgreSQL; genera queries type-safe y maneja migraciones.
- **Supabase 2.75.0**: Backend-as-a-Service con PostgreSQL, Auth (JWT sessions), Storage, y RLS para seguridad.
- **TypeScript 5**: Superset de JavaScript con tipado estático para mayor seguridad y productividad.
- **html2pdf.js 0.12.1**: Librería para convertir HTML de posts a PDF descargable.
- **nsfwjs 4.2.1 y bad-words 4.0.0**: Moderación NSFW manual (nsfwjs para imágenes, bad-words para texto).
- **Vitest 2.1.8**: Framework de testing moderno para unit/integration tests; ESLint 9 para linting de código.
- **Vercel**: Plataforma de deployment con optimizaciones para Next.js (CDN, ISR, analytics).

## Arquitectura y Estructura del Proyecto

El proyecto sigue una arquitectura modular con Next.js 16.0.8 App Router, separando frontend (Client Components) y backend (Server Components + API Routes). Usa Prisma 6.17.1 para acceso a BD type-safe y Supabase 2.75.0 para auth/RLS.

```
src/
├── app/                          # Rutas Next.js (App Router)
│   ├── (auth)/                   # Grupos de rutas: login, registro, reset password
│   │   ├── login/page.tsx        # Client Component con form Supabase
│   │   └── register/page.tsx     # Registro con validaciones
│   ├── (main)/                   # Rutas principales autenticadas
│   │   ├── dashboard/page.tsx    # Server Component con stats
│   │   ├── explore/page.tsx      # Feed público con paginación
│   │   └── post/[slug]/page.tsx  # Dynamic route para posts
│   ├── api/                      # API Routes (backend)
│   │   ├── posts/route.ts        # CRUD posts (GET/POST)
│   │   ├── likes/[id]/route.ts   # Toggle likes
│   │   └── comments/route.ts     # Comentarios anidados
│   ├── layout.tsx                # Root layout con auth provider
│   └── page.tsx                  # Home page (Server Component)
├── components/                   # Componentes reutilizables
│   ├── ui/                       # Primitivos: Button, Card, Input
│   ├── post/                     # PostReader, PostActions, PDFDownload
│   ├── comments/                 # CommentForm, CommentList
│   ├── notifications/            # NotificationPanel, NotificationItem
│   └── ...                       # Otros funcionales (NSFWFilter, etc.)
├── lib/                          # Utilidades y configuración
│   ├── prisma.ts                 # Cliente Prisma singleton
│   ├── supabase/                 # Clientes server/client Supabase
│   ├── utils.ts                  # Helpers: formatDate, getAvatarUrl
│   ├── profileThemes.ts          # Config temas (colores, emojis)
│   └── validations.ts            # Zod schemas para forms
├── prisma/                       # Base de datos
│   ├── schema.prisma             # Modelo: User, Post, Comment, Like, Follow, Notification, Category
│   └── migrations/               # Scripts de migración
├── types/                        # Definiciones TypeScript
└── middleware.ts                 # Seguridad: auth checks, headers
```

**Flujo de Datos**: Usuario -> Client Component -> API Route -> Prisma -> PostgreSQL -> Respuesta JSON -> UI update. Server Components saltan API para eficiencia.

## Instalación y Uso Local

### Prerrequisitos
- **Node.js 18+**: Descarga desde [nodejs.org](https://nodejs.org).
- **Git**: Para clonar el repo.
- **Cuenta Supabase**: Crea un proyecto gratuito en [supabase.com](https://supabase.com).

### Pasos de Instalación
1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/IsmaNov12/libreblog-nextjs.git
   cd libreblog-nextjs
   ```

2. **Instala dependencias**:
   ```bash
   npm install
   # Instala Next.js, Prisma, Supabase, Tailwind, etc.
   ```

3. **Configura variables de entorno**:
   - Copia el ejemplo: `cp .env.example .env.local`
   - Edita `.env.local` con tus claves de Supabase:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
     DATABASE_URL=postgresql://user:pass@host:5432/db
     NEXT_PUBLIC_EMAIL_AUTH_ENABLED=true
     ```

4. **Configura la base de datos**:
   ```bash
   npx prisma generate  # Genera cliente Prisma
   npx prisma db push   # Aplica schema a Supabase
   ```

5. **Ejecuta en desarrollo**:
   ```bash
   npm run dev
   ```
   La app estará en [http://localhost:3000](http://localhost:3000).

### Scripts Útiles
```bash
npm run dev         # Servidor de desarrollo con hot reload
npm run build       # Build optimizado para producción
npm run start       # Servidor producción local
npm run lint        # Ejecuta ESLint para calidad de código
npx prisma studio   # Abre interfaz gráfica para explorar BD
npm run test        # Ejecuta tests con Vitest
npm run test:watch  # Tests en modo watch
```

**Nota**: Para emails en desarrollo, configura SMTP en Supabase (usa Mailtrap).

## Funcionalidades Destacadas

- **Editor Markdown avanzado**: Soporte completo con paginación (`---PAGE---`), tabla de contenidos auto-generada, multimedia embebida y vista previa en tiempo real.
- **Sistema de comentarios anidados**: Comentarios hasta 3 niveles, edición/eliminación, notificaciones en tiempo real via WebSockets.
- **Moderación NSFW manual**: Checkbox para marcar posts, filtro borroso personalizable, sin detección automática.
- **Perfiles personalizables**: Temas visuales (6 opciones), decoraciones GIF, enlaces sociales, estadísticas dinámicas.
- **Seguridad integral**: Verificación HaveIBeenPwned, 2FA, RLS en BD, anti-spam (honeypots, rate limiting).

## Guía de API

LibreBlog usa API Routes de Next.js para operaciones CRUD. Ejemplos:

- **GET /api/posts**: Lista posts públicos (con paginación).
- **POST /api/posts**: Crea nuevo post (requiere auth).
- **GET /api/posts/[id]**: Obtiene post específico con comentarios.
- **POST /api/likes**: Toggle like en post.
- **GET /api/users/[id]/profile**: Datos de perfil.

Todas las rutas usan Prisma para queries type-safe y Supabase para auth. Respuestas en JSON.

## Configuración de Base de Datos

- **Schema Prisma**: Define modelos User, Post, Comment, Like, Follow, Notification, Category.
- **Migraciones**: Ejecuta `npx prisma migrate dev` para desarrollo; `db push` para staging/prod.
- **RLS Políticas**: En Supabase, habilita Row Level Security para tablas sensibles (posts privados, notifications).
- **Seeds**: Usa `npm run seed:categories` para poblar categorías iniciales.

**Comando útil**: `npx prisma studio` para GUI de BD.

## Despliegue Detallado

### Vercel (Recomendado)
1. Conecta repo GitHub a Vercel.
2. Configura env vars en Vercel Dashboard (igual que `.env.local`).
3. Deploy automático en pushes a main.
4. Optimiza con ISR para posts estáticos.

### Producción
- Configura SMTP en Supabase para emails.
- Habilita RLS y policies en BD.
- Monitorea logs en Vercel/Supabase.

**Variables requeridas en prod**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_EMAIL_AUTH_ENABLED=true`

## FAQ - Preguntas Frecuentes

**¿Cómo registro una cuenta?**
- Ve a `/register`, ingresa email/password válidos. Recibirás un email de confirmación para activar la cuenta.

**¿Cómo recupero mi contraseña?**
- En `/forgot-password`, ingresa tu email. Recibirás un enlace seguro para resetear (configura SMTP en Supabase para que llegue).

**¿Cómo funciona la moderación NSFW?**
- Marca posts como NSFW al crearlos. Los usuarios con filtro activado ven blur; confirma para ver.

**¿Puedo personalizar mi perfil?**
- Sí, edita bio, avatar, enlaces sociales, y elige temas/decoraciones en `/settings`.

**¿Cómo sigo a otros usuarios?**
- En perfiles, haz clic en "Follow". Verás su feed en `/following` con paginación infinita.

**¿Qué pasa si olvido cerrar sesión?**
- Sesiones expiran en 1 hora; revócalas manualmente en `/settings` para seguridad.

**¿Cómo descargo un post en PDF?**
- En la vista de post, usa el botón "Descargar PDF" (usa html2pdf.js).

**¿Hay límites en comentarios/likes?**
- Comentarios: Hasta 100 por post; likes ilimitados, pero rate limited.

## Troubleshooting - Problemas Comunes

**El correo de confirmación no llega:**
- Revisa carpeta Spam/Junk en tu email.
- Verifica que el email esté escrito correctamente (sin espacios extra).
- Configura SMTP en Supabase (usa Mailtrap para desarrollo) y habilita "Email provider".
- Intenta reenviar desde `/login` > "Reenviar confirmación".

**No puedo iniciar sesión o registrar:**
- Confirma tu email via el enlace recibido.
- Verifica conexión a internet y que Supabase esté activo.
- Si error "invalid credentials", resetea password.
- Revisa logs en terminal/browser console para errores de Supabase.

**El editor Markdown no carga o pierdo cambios:**
- Actualiza la página y verifica conexión.
- Usa navegadores modernos (Chrome 100+, Firefox 100+).
- Si autosave falla, guarda manualmente como borrador.

**Problemas de carga de imágenes/perfiles:**
- Asegúrate de que la URL de imagen sea válida y HTTPS.
- Extensiones como uBlock Origin pueden bloquear; desactívalas temporalmente.
- Para avatares, usa Gravatar o URLs directas.

**Desincronización de datos (ej. likes no actualizan):**
- Limpia caché del navegador (Ctrl+F5).
- Verifica que la API responda (usa DevTools > Network).
- Si persiste, reinicia servidor (`npm run dev`).

**Errores de Prisma/BBDD:**
- Ejecuta `npx prisma generate` si "client not found".
- Verifica `DATABASE_URL` en `.env.local`.
- Usa `npx prisma studio` para inspeccionar datos.

**Problemas en producción (Vercel):**
- Revisa logs en Vercel Dashboard > Functions/Deployments.
- Verifica env vars en Vercel (igual que local).
- Para emails, configura SMTP en Supabase.

Para problemas técnicos persistentes, abre un issue en GitHub con logs y pasos para reproducir.

## Contribuir

¡Se aceptan contribuciones! Sigue estos pasos para colaborar:

### Proceso de Contribución
1. **Haz un fork** del repositorio en GitHub.
2. **Clona tu fork** localmente: `git clone https://github.com/tu-usuario/libreblog-nextjs.git`
3. **Crea una rama** descriptiva: `git checkout -b feat/filtro-categorias` (usa prefijos: feat/, fix/, docs/, refactor/).
4. **Instala dependencias** y configura entorno (ver Instalación).
5. **Realiza cambios**:
   - Usa TypeScript estrictamente.
   - Sigue la arquitectura modular (Server/Client Components).
   - Aplica estilos con Tailwind CSS y clases utilitarias.
   - Agrega tests si es funcionalidad nueva.
6. **Haz commits** claros: `git commit -m 'feat: agrega filtro por categorías en explore'`
7. **Push a tu fork**: `git push origin feat/filtro-categorias`
8. **Abre un Pull Request** en el repo original, describiendo cambios, screenshots y pruebas.

### Guías de Código
- **TypeScript**: Interfaces en `src/types/`, type safety en APIs.
- **Componentes**: Pequeños, reutilizables, con props typed.
- **Estilos**: Tailwind utility-first; evita CSS custom.
- **Prisma**: Queries type-safe; usa includes para relaciones.
- **Tests**: Agrega con Vitest para funciones críticas.
- **Commits**: Conventional commits (feat, fix, etc.).

### Tipos de Contribuciones
- **Features**: Nuevas funcionalidades (ej. búsqueda, notificaciones push).
- **Fixes**: Corrección de bugs reportados.
- **Docs**: Mejoras en README, comentarios en código.
- **Refactors**: Limpieza de código sin cambiar funcionalidad.

### Requisitos para PR
- Código linted (`npm run lint`).
- Tests pasan (`npm run test`).
- Descripción detallada en PR.
- Compatible con versiones recientes de Node.js.

Si tienes dudas, abre un issue primero. ¡Gracias por contribuir!

---

## Changelog

### v2.1.0
- Rediseño completo con nueva paleta de colores.
- Logo cambiado a pluma antigua.
- Sistema de temas de perfil con 6 opciones.
- 16 decoraciones de avatar personalizables.
- Waves decorativas entre secciones.
- Moderación NSFW cambiada a manual.
- Sistema de blocklist personal.
- Paginación optimizada a 20 posts.
- Animaciones mejoradas en toda la UI.
- Mejoras visuales en todas las páginas.

## Licencia

MIT

## Equipo

- Guillermo Martinez -  Developer
- Alejandro Alonso -  Developer

Cualquier duda, sugerencia o aporte es bienvenido vía issues o Pull Request en este repositorio.

