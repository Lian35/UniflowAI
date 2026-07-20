<div align="center">

# 🎓 UniFlow AI Pro

### Intelligent Academic Management Platform powered by Artificial Intelligence

UniFlow AI Pro es una plataforma web diseñada para centralizar la gestión académica del estudiante mediante herramientas de planificación, organización, análisis de rendimiento e Inteligencia Artificial. El sistema integra en un único entorno la administración de materias, tareas, horarios, sesiones de estudio, notas personales y asistencia inteligente, permitiendo optimizar la productividad universitaria.

**Next.js 15 • React 19 • Firebase • Firestore • Gemini AI**

[🌐 UNIFLOWIA](https://uniflowaiv2.netlify.app/)

</div>

---

# 📖 Descripción

La vida universitaria genera grandes cantidades de información distribuida entre calendarios, aplicaciones de mensajería, documentos, plataformas institucionales y notas personales. Esta fragmentación dificulta el seguimiento del progreso académico y aumenta la carga cognitiva del estudiante.

UniFlow AI Pro propone una solución integral basada en Inteligencia Artificial capaz de centralizar toda la información académica dentro de un único ecosistema digital.

La plataforma permite administrar asignaturas, controlar créditos, organizar horarios, gestionar tareas, almacenar apuntes, realizar sesiones de estudio y utilizar un asistente inteligente capaz de responder consultas, resumir documentos y resolver problemas académicos.

El objetivo principal del proyecto es proporcionar una herramienta moderna, escalable y orientada a mejorar la organización y el rendimiento del estudiante universitario.

---

# ✨ Características principales

## Gestión Académica

- Administración completa de materias
- Control de créditos académicos
- Organización por semestres
- Gestión de horarios
- Visualización de la malla curricular

---

## Organización Personal

- Agenda inteligente
- Gestión de tareas
- Fechas límite
- Recordatorios
- Sistema de prioridades

---

## Inteligencia Artificial

Integración con Google Gemini para ofrecer:

- Tutor académico
- Explicación paso a paso de ejercicios
- Resumen automático de documentos
- Interpretación de imágenes
- Asistencia mediante lenguaje natural

---

## Productividad

- Deep Focus
- Registro de sesiones de estudio
- Historial de productividad
- Seguimiento del tiempo invertido

---

## Comunicación

- Chats privados
- Grupos de estudio
- Mensajería en tiempo real

---

# 🏗 Arquitectura del Sistema

```
                        ┌────────────────────┐
                        │     Frontend       │
                        │ Next.js + React    │
                        └─────────┬──────────┘
                                  │
                    Firebase Authentication
                                  │
                ┌─────────────────┴─────────────────┐
                │                                   │
          Cloud Firestore                    Gemini AI
                │                                   │
       Datos Académicos                   Tutor Inteligente
                │                                   │
                └───────────────┬───────────────────┘
                                │
                         Usuario Final
```

---

# 🛠 Stack Tecnológico

| Tecnología | Función |
|------------|----------|
| Next.js 15 | Framework Frontend |
| React 19 | Componentes |
| TypeScript | Tipado estático |
| Tailwind CSS | Diseño responsivo |
| ShadCN UI | Componentes UI |
| Firebase Authentication | Autenticación |
| Cloud Firestore | Base de datos |
| Firebase Hosting | Despliegue |
| Google Gemini 2.5 Flash | Inteligencia Artificial |
| Genkit | Integración con IA |

---

# 🗄 Arquitectura de Base de Datos

La plataforma utiliza **Cloud Firestore**, una base de datos NoSQL orientada a documentos, elegida por su capacidad de sincronización en tiempo real, escalabilidad automática y soporte offline.

```
users
│
├── profile
├── subjects
├── tasks
├── notes
├── studySessions
└── settings
      └── ai_context

chats
│
└── messages

system_logs

system_ai_interactions
```

---

# ¿Por qué Firestore?

Se optó por Firestore debido a que la plataforma requiere sincronización inmediata entre dispositivos y almacenamiento flexible para la información generada por la Inteligencia Artificial.

Las principales ventajas son:

- Sincronización en tiempo real.
- Soporte offline nativo.
- Escalabilidad automática.
- Almacenamiento flexible mediante documentos JSON.
- Integración directa con Firebase Authentication.
- Infraestructura completamente serverless.

---

# 📂 Estructura del Proyecto

```
app/
components/
contexts/
firebase/
hooks/
lib/
services/
styles/
types/
public/
```

---

# 📸 Capturas del Sistema

<div align="center">

<img src="https://github.com/user-attachments/assets/024a04cd-e5bf-4cb5-bf37-90dfcfe08cde" width="900">

<br><br>

<img src="https://github.com/user-attachments/assets/04b13b9c-4059-45e2-9219-42c45442b0a2" width="900">

<br><br>

<img src="https://github.com/user-attachments/assets/48670d32-b89c-4404-b52e-59d7d5ea52c9" width="900">

<br><br>

<img src="https://github.com/user-attachments/assets/1852855c-e688-4b02-b668-24ca0a861646" width="900">

<br><br>

<img src="https://github.com/user-attachments/assets/b673a242-f45e-4348-adde-8154708e991e" width="900">

<br><br>

<img src="https://github.com/user-attachments/assets/29c25097-9268-426b-933c-1d8cc2cdf9e1" width="900">

</div>

---

# 🚀 Principales Módulos

| Módulo | Descripción |
|---------|-------------|
| Dashboard | Panel principal con resumen académico |
| Subjects | Gestión de materias |
| Tasks | Administración de tareas |
| Schedule | Horarios |
| Tutor AI | Asistente inteligente |
| Notes | Apuntes personales |
| Deep Focus | Sesiones de estudio |
| Chat | Comunicación entre estudiantes |
| Analytics | Seguimiento del rendimiento |


---

# 👨‍💻 Autor

**Ronald Elian Hurtado Jama**

Estudiante de Ingeniería en Tecnologías de la Información.

---

# 📄 Licencia

Este proyecto fue desarrollado con fines educativos y como demostración de una plataforma moderna para la gestión académica mediante Inteligencia Artificial.

---

<div align="center">

### UniFlow AI Pro

**Smart Learning • Smart Planning • Smart Future**

</div>
