# UniFlow AI Pro — Ecosistema Académico Maestro

**UniFlow AI Pro** es una terminal académica de alto rendimiento diseñada para centralizar y optimizar la vida universitaria mediante Inteligencia Artificial de vanguardia y una gestión estratégica de datos. Este sistema actúa como el "Cerebro Central" del estudiante, integrando planificación, tutoría y seguimiento en una sola interfaz premium.

## 🎯 1. Propósito y Objetivo
El objetivo primordial de UniFlow es resolver la fragmentación de la información universitaria. Los estudiantes suelen dispersar sus metas en calendarios físicos, chats grupales, cuadernos y archivos PDF. UniFlow consolida todo este flujo en un ecosistema inteligente que no solo almacena datos, sino que los **interpreta** para reducir la carga cognitiva y maximizar el rendimiento académico.

### ¿Por qué lo creamos?
Para el estudiante del "1% académico", aquel que entiende que la carrera es una gestión de recursos finitos (tiempo y energía). Lo creamos para transformar la experiencia universitaria de una gestión reactiva (apagar incendios antes de exámenes) a una **estrategia proactiva** guiada por IA.

---

## 🚀 2. Arquitectura Técnica (Stack de Desarrollo)
El ecosistema ha sido desarrollado con el estándar industrial más exigente para garantizar velocidad, seguridad y escalabilidad:

- **Frontend Maestro**: [Next.js 15](https://nextjs.org/) (App Router) + [React 19](https://react.dev/). Permite una navegación instantánea y componentes de servidor para un SEO y rendimiento óptimos.
- **Identidad Visual**: [Tailwind CSS](https://tailwindcss.com/) + [ShadCN UI](https://ui.shadcn.com/). Diseño adaptativo con estética "Master Edition" (bordes redondeados, sombras profundas y paleta Aurora AI).
- **Cerebro Artificial**: [Google Gemini v2.5 Flash](https://ai.google.dev/) mediante [Genkit](https://firebase.google.com/docs/genkit). Implementamos flujos de IA para:
    - Tutoría STEM multimodal (Visión + Matemáticas).
    - Síntesis de textos largos (Resumidor).
    - Planificación dinámica de horarios.
- **Backend & Cloud**: [Firebase Ecosystem](https://firebase.google.com/).
    - **Authentication**: Gestión de identidad segura con verificación por correo (OTP).
    - **Firestore**: Base de datos de alta velocidad en tiempo real.
    - **App Hosting**: Infraestructura serverless de nueva generación.

---

## 📊 3. ¿Por qué usamos Firestore (NoSQL) en lugar de MySQL?
Esta es una decisión de ingeniería fundamental para aplicaciones de IA moderna:

1.  **Agilidad de Datos AI**: Los "Contextos de Memoria" de la IA generan objetos JSON altamente variables. NoSQL nos permite evolucionar estas estructuras sin migraciones de tablas complejas, permitiendo que la IA aprenda y guarde información nueva del estudiante instantáneamente.
2.  **Real-time Experience**: La mensajería y la agenda requieren actualizaciones en milisegundos. Firestore sincroniza el estado de la base de datos con la interfaz de forma nativa mediante WebSockets. En MySQL, esto requeriría capas adicionales (como Socket.io) aumentando la latencia.
3.  **Capacidad Offline**: Gracias al caché inteligente del SDK de Firestore, el estudiante puede consultar su malla y tareas sin internet. Los cambios se sincronizan automáticamente al recuperar la señal.
4.  **Escalabilidad Serverless**: Sin necesidad de administrar servidores de base de datos físicos, eliminando cuellos de botella durante picos de tráfico (semanas de parciales).

---

## 📂 4. Estructura de la Base de Datos
La información está organizada de forma jerárquica para maximizar la privacidad y el rendimiento:

### Nivel 1: Usuarios (`/users/{userId}`)
Contiene el perfil maestro, estado de verificación y preferencias de tema.
- **Sub-colección `subjects`**: Almacena el nombre, créditos (ITI ACD/16), semestre y el array de horarios (día, aula, horas).
- **Sub-colección `tasks`**: Gestión de entregas con prioridad, tipo (examen/tarea) y fecha de vencimiento.
- **Sub-colección `notes`**: Base de conocimientos personal en formato markdown.
- **Sub-colección `studySessions`**: Historial de bloques de enfoque (XP ganada, duración).
- **Sub-colección `settings/ai_context`**: **La Memoria Persistente**. Almacena el último diagnóstico de la IA para que el sistema "conozca" la tendencia del estudiante.

### Nivel 2: Comunicación (`/chats/{chatId}`)
- **Metadatos**: Participantes, tipo de chat (estudio/privado).
- **Sub-colección `messages`**: Flujo de mensajes con cifrado en tránsito.

### Nivel 3: Telemetría y Sistema
- **`/system_logs`**: Errores y eventos técnicos para el administrador.
- **`/system_ai_interactions`**: Registro global de consultas a la IA para monitoreo de cuota y calidad de respuesta.

---

## 🛠️ 5. Módulos Operativos
- **Control de Malla**: Gestión estratégica de la carrera con cálculo automático de créditos según el estándar ITI.
- **TutorIA Pro**: Asistente capaz de resolver ejercicios analizando imágenes o texto con formato KaTeX.
- **Planificador Dinámico**: Motor que genera rutas de estudio basadas en hábitos personales.
- **Deep Focus**: Bloques de concentración con analíticas de productividad.
- **Mensajería**: Comunicación para grupos de estudio.
- **Predictor de Impacto**: Detecta riesgos académicos antes de que ocurran.

---
© 2024 UniFlow Ecosystem • Diseñado para el 1% académico.
